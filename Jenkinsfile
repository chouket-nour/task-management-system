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
        COMPOSE_FILE                = "${env.WORKSPACE}/docker-compose.yml"
        TRIVY_CACHE_DIR             = "/var/jenkins_home/.cache/trivy"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=== Recuperation depuis GitHub ==='
                checkout scm
                sh 'node --version && npm --version'
            }
        }

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

        stage('Install') {
            failFast true
            parallel {
                stage('auth')    { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/auth-service')          { sh 'npm ci --prefer-offline' } } } } }
                stage('user')    { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/user-service')          { sh 'npm ci --prefer-offline' } } } } }
                stage('task')    { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/task-service')          { sh 'npm ci --prefer-offline' } } } } }
                stage('project') { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/project-service')      { sh 'npm ci --prefer-offline' } } } } }
                stage('conge')   { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/conge-service')        { sh 'npm ci --prefer-offline' } } } } }
                stage('notif')   { steps { timeout(time: 10, unit: 'MINUTES') { retry(2) { dir('backend/notification-service') { sh 'npm ci --prefer-offline' } } } } }
            }
        }

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

        stage('Tests') {
            failFast true
            parallel {
                stage('Test auth')    { steps { dir('backend/auth-service')          { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/auth-service/junit.xml' } } }
                stage('Test user')    { steps { dir('backend/user-service')          { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/user-service/junit.xml' } } }
                stage('Test task')    { steps { dir('backend/task-service')          { sh 'npm test' } } post { always { junit allowEmptyResults: true, testResults: 'backend/task-service/junit.xml' } } }
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

        stage('Build Docker') {
            when { expression { params.SKIP_DOCKER == false } }
            steps {
                script {
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
                                sh """
                                    docker buildx build \
                                        --builder rfc-builder \
                                        --platform linux/amd64 \
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

        stage('Push Docker') {
            when { expression { params.SKIP_DOCKER == false } }
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
                                    docker push ${REGISTRY}/rfc-${svc}:${IMAGE_TAG}
                                    docker push ${REGISTRY}/rfc-${svc}:latest
                                """
                                pushed = true
                                echo "${svc} pushed (attempt ${attempts})"
                            } catch (e) {
                                if (attempts < 3) {
                                    sleep(attempts * 20)
                                } else {
                                    error "Push ${svc} failed after 3 attempts"
                                }
                            }
                        }
                        sleep(8)
                    }
                }
            }
        }

        stage('Download Trivy DB') {
            when { expression { params.SKIP_DOCKER == false } }
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
            when { expression { params.SKIP_DOCKER == false } }
            steps {
                script {
                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')

                    def trivyReport = [:]
                    def trivyFailed = []

                    services.each { service ->
                        def svc = service.trim()
                        echo "=== Trivy scan: ${svc} ==="

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
                                    ${REGISTRY}/rfc-${svc}:${IMAGE_TAG}
                            """
                        )

                        trivyReport[svc] = (exitCode == 0) ? 'CLEAN' : 'VULNERABLE'
                        if (exitCode != 0) trivyFailed.add(svc)
                    }

                    echo "============================================"
                    echo "         TRIVY SECURITY REPORT"
                    echo "============================================"
                    trivyReport.each { svc, status ->
                        def icon = (status == 'CLEAN') ? '[OK]  ' : '[FAIL]'
                        echo "${icon}  ${svc.padRight(30)} ${status}"
                    }
                    echo "============================================"

                    if (trivyFailed) {
                        unstable("Vulnerabilites HIGH/CRITICAL detectees dans: ${trivyFailed.join(', ')}")
                    }
                }
            }
        }

        stage('Deploy') {
            when { expression { params.ROLLBACK == false } }
            steps {
                script {
                    if (params.ENV == 'prod') {
                        input message: "Confirm deployment to PRODUCTION?", ok: "Deploy"
                    }
                }
                sh "IMAGE_TAG=${IMAGE_TAG} docker-compose -f ${COMPOSE_FILE} up -d --remove-orphans"
            }
        }

        stage('Rollback') {
            when { expression { params.ROLLBACK == true } }
            steps {
                echo "Rolling back to: ${env.PREV_TAG}"
                sh "IMAGE_TAG=${env.PREV_TAG} docker-compose -f ${COMPOSE_FILE} up -d --remove-orphans"
            }
        }

        stage('Health Check') {
            when { expression { params.ROLLBACK == false } }
            steps {
                sh '''
                    for i in $(seq 1 12); do
                        curl -sf http://localhost:5000/health && echo "API OK" && exit 0
                        echo "Attempt $i/12 -- waiting 5s..."
                        sleep 5
                    done
                    echo "Health check failed after 60s"
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
        failure {
            echo "Failed -- build #${env.BUILD_NUMBER}"
            sh "docker-compose -f ${COMPOSE_FILE} logs --tail=50 || true"
        }
        success {
            echo "RFC Connect deployed -- build #${env.BUILD_NUMBER} -- version ${env.IMAGE_TAG}"
        }
        always {
            echo "Pipeline finished -- build #${env.BUILD_NUMBER}"
            cleanWs()
        }
    }
}