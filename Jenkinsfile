pipeline {
    agent any
    tools { nodejs 'NodeJS' }

    parameters {
        choice(name: 'ENV',           choices: ['dev', 'staging', 'prod'], description: 'Environnement cible')
        choice(name: 'DEPLOY_TARGET', choices: ['local', 'k8s'],           description: 'Déploiement local (docker-compose) ou cloud (Kubernetes)')
        booleanParam(name: 'ROLLBACK',    defaultValue: false, description: 'Rollback vers la version précédente')
        booleanParam(name: 'SKIP_DOCKER', defaultValue: false, description: 'Passer le build/push Docker')
    }

    environment {
        // ── Registry ──
        REGISTRY         = "nourchouket2000"
        BACKEND_SERVICES = "auth-service,user-service,task-service,project-service,conge-service,notification-service,api-gateway"

        // ── MongoDB URIs (pas de mot de passe → pas dans Credentials) ──
        MONGO_URI_AUTH    = "mongodb://mongodb:27017/auth"
        MONGO_URI_USER    = "mongodb://mongodb:27017/user"
        MONGO_URI_TASK    = "mongodb://mongodb:27017/task"
        MONGO_URI_PROJECT = "mongodb://mongodb:27017/project"
        MONGO_URI_CONGE   = "mongodb://mongodb:27017/conge"
        MONGO_URI_NOTIF   = "mongodb://mongodb:27017/notif"

        // ── URLs des services (pas secrètes → pas dans Credentials) ──
        AUTH_SERVICE_URL    = "http://auth-service:5001"
        USER_SERVICE_URL    = "http://user-service:5002"
        TASK_SERVICE_URL    = "http://task-service:5003"
        PROJECT_SERVICE_URL = "http://project-service:5004"
        CONGE_SERVICE_URL   = "http://conge-service:5005"
        NOTIF_SERVICE_URL   = "http://notification-service:5006"
        REACT_APP_API_URL   = "http://localhost:5000"

        // ── Docker & Build ──
        DOCKER_BUILDKIT  = "1"
        COMPOSE_FILE     = "${env.WORKSPACE}/docker-compose.yml"

        // ── Cache ──
        NPM_CONFIG_CACHE            = "/var/jenkins_home/.npm-cache"
        MONGOMS_DOWNLOAD_DIR        = "/var/jenkins_home/.cache/mongodb-binaries"
        MONGOMS_DISABLE_POSTINSTALL = "1"
        TRIVY_CACHE_DIR             = "/var/jenkins_home/.cache/trivy"
    }

    stages {

        // ══════════════════════════════════════════════════════════════
        // CHECKOUT
        // ══════════════════════════════════════════════════════════════
        stage('Checkout') {
            steps {
                echo '=== Recuperation depuis GitHub ==='
                checkout scm
                sh 'node --version && npm --version'
            }
        }

        // ══════════════════════════════════════════════════════════════
        // VERSIONING
        // ══════════════════════════════════════════════════════════════
        stage('Init Versioning') {
            steps {
                script {
                    env.GIT_TAG   = sh(script: "git describe --tags --always || echo v0.0.0", returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.GIT_TAG}-${env.BUILD_NUMBER}"
                    env.PREV_TAG  = sh(
                        script: "git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo ''",
                        returnStdout: true
                    ).trim()
                    if (!env.PREV_TAG) {
                        env.PREV_TAG = "${env.GIT_TAG}-${(env.BUILD_NUMBER.toInteger() - 1).toString()}"
                    }
                }
                echo "Version courante  : ${env.IMAGE_TAG}"
                echo "Version precedente: ${env.PREV_TAG}"
            }
        }

        // ══════════════════════════════════════════════════════════════
        // INSTALL
        // ══════════════════════════════════════════════════════════════
        stage('Install') {
            failFast true
            parallel {
                stage('auth')    { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/auth-service')         { sh 'npm ci --prefer-offline' } } } } }
                stage('user')    { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/user-service')         { sh 'npm ci --prefer-offline' } } } } }
                stage('task')    { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/task-service')         { sh 'npm ci --prefer-offline' } } } } }
                stage('project') { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/project-service')      { sh 'npm ci --prefer-offline' } } } } }
                stage('conge')   { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/conge-service')        { sh 'npm ci --prefer-offline' } } } } }
                stage('notif')   { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/notification-service') { sh 'npm ci --prefer-offline' } } } } }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // PREPARE MONGODB BINARY
        // ══════════════════════════════════════════════════════════════
        stage('Prepare MongoDB Binary') {
            steps {
                sh '''
                    mkdir -p /var/jenkins_home/.cache/mongodb-binaries
                    cd backend/auth-service
                    node -e "
                      const { MongoMemoryServer } = require('mongodb-memory-server');
                      MongoMemoryServer.create().then(s => {
                        console.log('Binaire MongoDB pret');
                        s.stop();
                      });
                    "
                '''
            }
        }

        // ══════════════════════════════════════════════════════════════
        // TESTS
        // ══════════════════════════════════════════════════════════════
        stage('Tests') {
            failFast true
            parallel {
                stage('Test auth') {
                    steps { dir('backend/auth-service')         { sh 'npm test' } }
                    post  { always { junit allowEmptyResults: true, testResults: 'backend/auth-service/junit.xml' } }
                }
                stage('Test user') {
                    steps { dir('backend/user-service')         { sh 'npm test' } }
                    post  { always { junit allowEmptyResults: true, testResults: 'backend/user-service/junit.xml' } }
                }
                stage('Test task') {
                    steps { dir('backend/task-service')         { sh 'npm test' } }
                    post  { always { junit allowEmptyResults: true, testResults: 'backend/task-service/junit.xml' } }
                }
                stage('Test project') {
                    steps { dir('backend/project-service')      { sh 'npm test' } }
                    post  { always { junit allowEmptyResults: true, testResults: 'backend/project-service/junit.xml' } }
                }
                stage('Test conge') {
                    steps { dir('backend/conge-service')        { sh 'npm test' } }
                    post  { always { junit allowEmptyResults: true, testResults: 'backend/conge-service/junit.xml' } }
                }
                stage('Test notif') {
                    steps { dir('backend/notification-service') { sh 'npm test' } }
                    post  { always { junit allowEmptyResults: true, testResults: 'backend/notification-service/junit.xml' } }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // COVERAGE
        // ══════════════════════════════════════════════════════════════
        stage('Verify Coverage') {
            steps {
                sh '''
                    echo "=== TOUS les lcov.info dans le workspace ==="
                    find ${WORKSPACE} -name "lcov.info" 2>/dev/null | grep -v node_modules

                    echo "=== TOUS les dossiers coverage ==="
                    find ${WORKSPACE} -type d -name "coverage" 2>/dev/null | grep -v node_modules
                '''
            }
        }

        stage('Merge Coverage') {
            steps {
                sh '''
                    rm -f coverage/lcov.info
                    mkdir -p coverage
                    for service in auth-service user-service task-service project-service conge-service notification-service; do
                        lcov_path="backend/${service}/coverage/lcov.info"
                        if [ -f "$lcov_path" ]; then
                            echo "Merging: $lcov_path"
                            sed "s|SF:|SF:backend/${service}/|g" "$lcov_path" >> coverage/lcov.info
                        else
                            echo "WARNING: $lcov_path not found"
                        fi
                    done
                    echo "=== Merged coverage lines ==="
                    wc -l coverage/lcov.info
                    echo "=== SF paths sample ==="
                    grep "^SF:" coverage/lcov.info | head -20
                '''
            }
        }

        // ══════════════════════════════════════════════════════════════
        // SONARQUBE
        // ══════════════════════════════════════════════════════════════
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectVersion=${env.IMAGE_TAG}
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate abortPipeline: false
                        if (qg.status != 'OK') { error "Quality Gate FAILED : ${qg.status}" }
                        echo "Quality Gate PASSED"
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // DOCKER
        // ══════════════════════════════════════════════════════════════
        stage('Docker Login') {
            when { expression { !params.SKIP_DOCKER } }
            steps {
                withCredentials([
                    string(credentialsId: 'docker-username', variable: 'DOCKER_USER'),
                    string(credentialsId: 'docker-password', variable: 'DOCKER_PASS')
                ]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Build Docker') {
            when { expression { !params.SKIP_DOCKER } }
            steps {
                script {
                    sh '''
                        docker buildx create --use --name rfc-builder \
                            --driver-opt network=host 2>/dev/null || \
                        docker buildx use rfc-builder
                        docker buildx inspect --bootstrap
                    '''
                    def services    = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')
                    def buildStages = [:]
                    services.each { service ->
                        def svc     = service.trim()
                        def context = (svc == 'frontend') ? './frontend' : "./backend/${svc}"
                        buildStages["Build ${svc}"] = {
                            retry(2) {
                                sh """
                                    docker buildx build \
                                        --builder rfc-builder \
                                        --platform linux/amd64 \
                                        --tag ${REGISTRY}/rfc-${svc}:${env.IMAGE_TAG} \
                                        --tag ${REGISTRY}/rfc-${svc}:latest \
                                        --load \
                                        ${context}
                                """
                            }
                        }
                    }
                    parallel buildStages
                }
            }
        }

        stage('Push Docker') {
            when { expression { !params.SKIP_DOCKER } }
            steps {
                script {
                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')
                    services.each { service ->
                        def svc      = service.trim()
                        def pushed   = false
                        def attempts = 0
                        echo "=== Pushing ${svc} ==="
                        while (!pushed && attempts < 3) {
                            attempts++
                            try {
                                sh """
                                    docker push ${REGISTRY}/rfc-${svc}:${env.IMAGE_TAG}
                                    docker push ${REGISTRY}/rfc-${svc}:latest
                                """
                                pushed = true
                            } catch (e) {
                                if (attempts < 3) { sleep(attempts * 20) }
                                else { error "Push ${svc} echoue apres 3 tentatives" }
                            }
                        }
                        sleep(8)
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // SECURITY SCAN
        // ══════════════════════════════════════════════════════════════
        stage('Download Trivy DB') {
            when { expression { !params.SKIP_DOCKER } }
            steps {
                sh """
                    mkdir -p ${TRIVY_CACHE_DIR}
                    trivy image \
                        --download-db-only \
                        --cache-dir ${TRIVY_CACHE_DIR} \
                        --timeout 20m
                """
            }
        }

        stage('Security Scan (Trivy)') {
            when { expression { !params.SKIP_DOCKER } }
            steps {
                script {
                    def services    = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')
                    def trivyReport = [:]
                    def trivyFailed = []
                    services.each { service ->
                        def svc      = service.trim()
                        def exitCode = sh(
                            returnStatus: true,
                            script: """
                                trivy image \
                                    --exit-code 1 \
                                    --severity HIGH,CRITICAL \
                                    --ignore-unfixed \
                                    --scanners vuln \
                                    --skip-db-update \
                                    --format table \
                                    --ignorefile ${WORKSPACE}/.trivyignore \
                                    --cache-dir ${TRIVY_CACHE_DIR} \
                                    --timeout 10m \
                                    ${REGISTRY}/rfc-${svc}:${env.IMAGE_TAG}
                            """
                        )
                        trivyReport[svc] = (exitCode == 0) ? 'CLEAN' : 'VULNERABLE'
                        if (exitCode != 0) trivyFailed.add(svc)
                    }
                    echo "============================================"
                    echo "         TRIVY SECURITY REPORT"
                    echo "============================================"
                    trivyReport.each { svc, status ->
                        echo "${(status == 'CLEAN') ? '[OK]  ' : '[FAIL]'}  ${svc.padRight(30)} ${status}"
                    }
                    echo "============================================"
                    if (trivyFailed) {
                        unstable("Vulnerabilites HIGH/CRITICAL : ${trivyFailed.join(', ')}")
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // DEPLOY
        // ══════════════════════════════════════════════════════════════
        stage('Deploy') {
            when { expression { !params.ROLLBACK } }
            steps {
                script {
                    if (params.ENV == 'prod') {
                        input message: "Confirmer le déploiement en PRODUCTION ?", ok: "Deploy"
                    }
                }
                withCredentials([
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                ]) {
                    script {
                        if (params.DEPLOY_TARGET == 'local') {
                            // ── MODE LOCAL : docker-compose ──
                            sh """
                                IMAGE_TAG=${env.IMAGE_TAG} \
                                JWT_SECRET=\$JWT_SECRET \
                                MONGO_URI_AUTH=${MONGO_URI_AUTH} \
                                MONGO_URI_USER=${MONGO_URI_USER} \
                                MONGO_URI_TASK=${MONGO_URI_TASK} \
                                MONGO_URI_PROJECT=${MONGO_URI_PROJECT} \
                                MONGO_URI_CONGE=${MONGO_URI_CONGE} \
                                MONGO_URI_NOTIF=${MONGO_URI_NOTIF} \
                                AUTH_SERVICE_URL=${AUTH_SERVICE_URL} \
                                USER_SERVICE_URL=${USER_SERVICE_URL} \
                                TASK_SERVICE_URL=${TASK_SERVICE_URL} \
                                PROJECT_SERVICE_URL=${PROJECT_SERVICE_URL} \
                                CONGE_SERVICE_URL=${CONGE_SERVICE_URL} \
                                NOTIF_SERVICE_URL=${NOTIF_SERVICE_URL} \
                                REACT_APP_API_URL=${REACT_APP_API_URL} \
                                docker-compose -f ${COMPOSE_FILE} up -d --remove-orphans
                            """
                        } else {
                            // ── MODE CLOUD : Kubernetes / Helm ──
                            withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                                sh """
                                    helm upgrade --install rfc-connect ./helm/rfc-connect \
                                        --namespace ${params.ENV} \
                                        --create-namespace \
                                        --set image.tag=${env.IMAGE_TAG} \
                                        --set image.registry=${REGISTRY} \
                                        --set secrets.jwtSecret=\$JWT_SECRET \
                                        --set mongo.uriAuth=${MONGO_URI_AUTH} \
                                        --set mongo.uriUser=${MONGO_URI_USER} \
                                        --set mongo.uriTask=${MONGO_URI_TASK} \
                                        --set mongo.uriProject=${MONGO_URI_PROJECT} \
                                        --set mongo.uriConge=${MONGO_URI_CONGE} \
                                        --set mongo.uriNotif=${MONGO_URI_NOTIF} \
                                        --wait --timeout 5m
                                """
                            }
                        }
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // ROLLBACK
        // ══════════════════════════════════════════════════════════════
        stage('Rollback') {
            when { expression { params.ROLLBACK } }
            steps {
                echo "Rolling back vers : ${env.PREV_TAG}"
                withCredentials([
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                ]) {
                    sh """
                        IMAGE_TAG=${env.PREV_TAG} \
                        JWT_SECRET=\$JWT_SECRET \
                        MONGO_URI_AUTH=${MONGO_URI_AUTH} \
                        MONGO_URI_USER=${MONGO_URI_USER} \
                        MONGO_URI_TASK=${MONGO_URI_TASK} \
                        MONGO_URI_PROJECT=${MONGO_URI_PROJECT} \
                        MONGO_URI_CONGE=${MONGO_URI_CONGE} \
                        MONGO_URI_NOTIF=${MONGO_URI_NOTIF} \
                        AUTH_SERVICE_URL=${AUTH_SERVICE_URL} \
                        USER_SERVICE_URL=${USER_SERVICE_URL} \
                        TASK_SERVICE_URL=${TASK_SERVICE_URL} \
                        PROJECT_SERVICE_URL=${PROJECT_SERVICE_URL} \
                        CONGE_SERVICE_URL=${CONGE_SERVICE_URL} \
                        NOTIF_SERVICE_URL=${NOTIF_SERVICE_URL} \
                        REACT_APP_API_URL=${REACT_APP_API_URL} \
                        docker-compose -f ${COMPOSE_FILE} up -d --remove-orphans
                    """
                }
            }
        }

        // ══════════════════════════════════════════════════════════════
        // HEALTH CHECK
        // ══════════════════════════════════════════════════════════════
        stage('Health Check') {
            when { expression { !params.ROLLBACK } }
            steps {
                sh '''
                    echo "=== Health check via réseau Docker ==="
                    for i in $(seq 1 24); do
                        HTTP_CODE=$(curl -o /dev/null -s -w "%{http_code}" \
                            --connect-timeout 3 --max-time 5 \
                            http://api-gateway:5000/health || echo "000")
                        if [ "$HTTP_CODE" = "200" ]; then
                            echo "[OK] api-gateway healthy apres tentative $i"
                            exit 0
                        fi
                        echo "Tentative $i/24 -- HTTP $HTTP_CODE -- attente 5s..."
                        sleep 5
                    done
                    echo "================================================"
                    echo "  HEALTH CHECK ECHOUE apres 120s"
                    echo "================================================"
                    docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                    docker inspect --format "{{.Name}} => {{.State.Health.Status}}" \
                        mongodb auth-service user-service task-service \
                        project-service conge-service notification-service \
                        api-gateway 2>&1 || true
                    docker logs api-gateway --tail=50 2>&1 || true
                    exit 1
                '''
            }
        }

        // ══════════════════════════════════════════════════════════════
        // CLEANUP
        // ══════════════════════════════════════════════════════════════
        stage('Cleanup') {
            steps {
                sh '''
                    docker buildx rm rfc-builder 2>/dev/null || true
                    docker image prune -f
                '''
            }
        }
    }

    post {
        failure {
            echo "ECHEC -- build #${env.BUILD_NUMBER}"
            sh "docker-compose -f ${COMPOSE_FILE} logs --tail=50 || true"
        }
        success {
            echo "RFC Connect déployé -- build #${env.BUILD_NUMBER} -- version ${env.IMAGE_TAG}"
        }
        always {
            echo "Pipeline terminé -- build #${env.BUILD_NUMBER}"
            cleanWs()
        }
    }
}