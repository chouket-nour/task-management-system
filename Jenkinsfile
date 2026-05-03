pipeline {
    agent any
    tools { nodejs 'NodeJS' }

    parameters {
        choice(name: 'ENV', choices: ['dev', 'staging', 'prod'], description: 'Environnement cible')
        booleanParam(name: 'ROLLBACK',    defaultValue: false, description: 'Rollback manuel')
        booleanParam(name: 'SKIP_DOCKER', defaultValue: false, description: 'Passer le build Docker')
    }

    environment {
        REGISTRY                    = "nourchouket2000"
        IMAGE_TAG                   = "${env.BUILD_NUMBER}"
        BACKEND_SERVICES            = "auth-service,user-service,task-service,project-service,conge-service,notification-service,api-gateway"
        NPM_CONFIG_CACHE            = "/var/jenkins_home/.npm-cache"
        MONGOMS_DOWNLOAD_DIR        = "/var/jenkins_home/.cache/mongodb-binaries"
        MONGOMS_DISABLE_POSTINSTALL = "1"
        DOCKER_BUILDKIT             = "1"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=== Récupération depuis GitHub ==='
                checkout scm
                sh 'node --version && npm --version'
            }
        }

        stage('Init Versioning') {
            steps {
                script {
                    env.GIT_TAG   = sh(script: "git describe --tags --always || echo v0.0.0", returnStdout: true).trim()
                    env.IMAGE_TAG = "${env.GIT_TAG}-${env.BUILD_NUMBER}"
                    env.PREV_TAG  = "${env.GIT_TAG}-${(env.BUILD_NUMBER.toInteger() - 1).toString()}"
                }
                echo "Version courante  : ${env.IMAGE_TAG}"
                echo "Version précédente: ${env.PREV_TAG}"
            }
        }

        stage('Install') {
            failFast true
            parallel {
                stage('auth')    { steps { timeout(10, 'MINUTES') { retry(2) { dir('backend/auth-service')         { sh 'npm ci --prefer-offline' } } } } }
                stage('user')    { steps { timeout(10, 'MINUTES') { retry(2) { dir('backend/user-service')         { sh 'npm ci --prefer-offline' } } } } }
                stage('task')    { steps { timeout(10, 'MINUTES') { retry(2) { dir('backend/task-service')         { sh 'npm ci --prefer-offline' } } } } }
                stage('project') { steps { timeout(10, 'MINUTES') { retry(2) { dir('backend/project-service')      { sh 'npm ci --prefer-offline' } } } } }
                stage('conge')   { steps { timeout(10, 'MINUTES') { retry(2) { dir('backend/conge-service')        { sh 'npm ci --prefer-offline' } } } } }
                stage('notif')   { steps { timeout(10, 'MINUTES') { retry(2) { dir('backend/notification-service') { sh 'npm ci --prefer-offline' } } } } }
            }
        }

        stage('Prepare MongoDB Binary') {
            steps {
                sh '''
                    mkdir -p /var/jenkins_home/.cache/mongodb-binaries
                    cd backend/auth-service
                    node -e "
                      const { MongoMemoryServer } = require('mongodb-memory-server');
                      MongoMemoryServer.create().then(s => { console.log('MongoDB binaire prêt'); s.stop(); });
                    "
                '''
            }
        }

        stage('Tests') {
            failFast true
            parallel {
                stage('Test auth')    { steps { dir('backend/auth-service')         { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/auth-service/junit.xml' } } }
                stage('Test user')    { steps { dir('backend/user-service')         { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/user-service/junit.xml' } } }
                stage('Test task')    { steps { dir('backend/task-service')         { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/task-service/junit.xml' } } }
                stage('Test project') { steps { dir('backend/project-service')      { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/project-service/junit.xml' } } }
                stage('Test conge')   { steps { dir('backend/conge-service')        { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/conge-service/junit.xml' } } }
                stage('Test notif')   { steps { dir('backend/notification-service') { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/notification-service/junit.xml' } } }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        sh "${scannerHome}/bin/sonar-scanner"
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

        stage('Docker Login') {
            when { expression { params.SKIP_DOCKER == false } }
            steps {
                withCredentials([
                    string(credentialsId: 'docker-username', variable: 'DOCKER_USER'),
                    string(credentialsId: 'docker-password', variable: 'DOCKER_PASS')
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        echo "Docker Hub login OK"
                    '''
                }
            }
        }

        // ─── FIX PRINCIPAL : Build en parallèle → Push séquentiel ───────────
        stage('Build Docker (parallèle)') {
            when { expression { params.SKIP_DOCKER == false } }
            steps {
                script {
                    // Créer le builder une seule fois
                    sh '''
                        docker buildx create --use --name rfc-builder \
                            --driver-opt network=host 2>/dev/null || \
                        docker buildx use rfc-builder
                        docker buildx inspect --bootstrap
                    '''

                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')

                    def buildStages = [:]
                    services.each { service ->
                        def svc     = service.trim()
                        def context = (svc == 'frontend') ? './frontend' : "./backend/${svc}"

                        buildStages["Build ${svc}"] = {
                            retry(2) {
                                // ✅ FIX 1 : --output type=docker — build local SANS push
                                // ✅ FIX 3 : plus de --cache-to (inutile, cause les 400)
                                sh """
                                    docker buildx build \
                                        --builder rfc-builder \
                                        --platform linux/amd64 \
                                        --cache-from type=registry,ref=${REGISTRY}/rfc-${svc}:cache \
                                        --tag ${REGISTRY}/rfc-${svc}:${IMAGE_TAG} \
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

        stage('Push Docker (séquentiel)') {
            when { expression { params.SKIP_DOCKER == false } }
            steps {
                script {
                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')

                    // ✅ FIX 2 : push séquentiel — une image à la fois
                    // Chaque push dure < 5 min → session Docker Hub jamais expirée
                    services.each { service ->
                        def svc = service.trim()
                        retry(3) {
                            sh """
                                echo "=== Push ${svc} ==="
                                docker push ${REGISTRY}/rfc-${svc}:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-${svc}:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Security Scan (Trivy)') {
            when { expression { params.SKIP_DOCKER == false } }
            steps {
                script {
                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')

                    def trivyStages = [:]
                    services.each { service ->
                        def svc = service.trim()
                        trivyStages["Trivy ${svc}"] = {
                            sh """
                                trivy image \
                                    --exit-code 0 \
                                    --severity HIGH,CRITICAL \
                                    --ignore-unfixed \
                                    --scanners vuln \
                                    ${REGISTRY}/rfc-${svc}:${IMAGE_TAG}
                            """
                        }
                    }
                    parallel trivyStages
                }
            }
        }

        stage('Deploy') {
            when { expression { params.ROLLBACK == false } }
            steps {
                script {
                    if (params.ENV == 'prod') {
                        input message: "Confirmer le déploiement en PRODUCTION ?", ok: "Déployer"
                    }
                }
                sh """
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml pull
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml up -d --remove-orphans
                """
            }
        }

        stage('Rollback') {
            when { expression { params.ROLLBACK == true } }
            steps {
                echo "Rollback vers : ${env.PREV_TAG}"
                sh "IMAGE_TAG=${env.PREV_TAG} docker-compose -f docker-compose.yml up -d --remove-orphans"
            }
        }

        stage('Health Check') {
            when { expression { params.ROLLBACK == false } }
            steps {
                sh '''
                    for i in $(seq 1 12); do
                        curl -sf http://localhost:5000/health && echo "API OK" && exit 0
                        echo "Tentative $i/12 — attente 5s..."
                        sleep 5
                    done
                    echo "Health check échoué après 60s"
                    exit 1
                '''
            }
        }

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
        success { echo "RFC Connect déployé — build #${env.BUILD_NUMBER} — version ${env.IMAGE_TAG}" }
        failure {
            echo "Échec — build #${env.BUILD_NUMBER}"
            sh "docker-compose -f docker-compose.yml logs --tail=50 || true"
        }
        always {
            echo "Pipeline terminé — build #${env.BUILD_NUMBER}"
            cleanWs()
        }
    }
}