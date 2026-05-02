pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    parameters {
        choice(name: 'ENV', choices: ['dev', 'staging', 'prod'], description: 'Environnement cible')
        booleanParam(name: 'ROLLBACK', defaultValue: false, description: 'Rollback manuel vers la révision précédente')
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
                echo '=== Recuperation depuis GitHub ==='
                checkout scm
                sh 'node --version'
                sh 'npm --version'
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
                echo "Version precedente: ${env.PREV_TAG}"
            }
        }

        stage('Install') {
            failFast true
            parallel {
                stage('auth') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/auth-service') { sh 'npm ci --prefer-offline' }
                            }
                        }
                    }
                }
                stage('user') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/user-service') { sh 'npm ci --prefer-offline' }
                            }
                        }
                    }
                }
                stage('task') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/task-service') { sh 'npm ci --prefer-offline' }
                            }
                        }
                    }
                }
                stage('project') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/project-service') { sh 'npm ci --prefer-offline' }
                            }
                        }
                    }
                }
                stage('conge') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/conge-service') { sh 'npm ci --prefer-offline' }
                            }
                        }
                    }
                }
                stage('notif') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/notification-service') { sh 'npm ci --prefer-offline' }
                            }
                        }
                    }
                }
            }
        }

        stage('Prepare MongoDB Binary') {
            steps {
                echo '=== Pre-telechargement du binaire MongoDB ==='
                sh '''
                    mkdir -p /var/jenkins_home/.cache/mongodb-binaries
                    cd backend/auth-service
                    node -e "
                      const { MongoMemoryServer } = require('mongodb-memory-server');
                      MongoMemoryServer.create().then(s => {
                        console.log('Binaire MongoDB pret dans le cache');
                        s.stop();
                      });
                    "
                '''
            }
        }

        stage('Tests') {
            failFast true
            parallel {
                stage('Test auth') {
                    steps { dir('backend/auth-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/auth-service/junit.xml' } }
                }
                stage('Test user') {
                    steps { dir('backend/user-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/user-service/junit.xml' } }
                }
                stage('Test task') {
                    steps { dir('backend/task-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/task-service/junit.xml' } }
                }
                stage('Test project') {
                    steps { dir('backend/project-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/project-service/junit.xml' } }
                }
                stage('Test conge') {
                    steps { dir('backend/conge-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/conge-service/junit.xml' } }
                }
                stage('Test notif') {
                    steps { dir('backend/notification-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/notification-service/junit.xml' } }
                }
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
                        if (qg.status != 'OK') {
                            error "Quality Gate FAILED : statut = ${qg.status}"
                        }
                        echo "Quality Gate PASSED (statut : ${qg.status})"
                    }
                }
            }
        }

        stage('Docker Login') {
            when {
                expression { params.SKIP_DOCKER == false }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'docker-username', variable: 'DOCKER_USER'),
                    string(credentialsId: 'docker-password', variable: 'DOCKER_PASS')
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin \
                            || { echo "Docker login failed"; exit 1; }
                        echo "Docker Hub login OK"
                    '''
                }
            }
        }

        stage('Build & Push Docker') {
            when {
                expression { params.SKIP_DOCKER == false }
            }
            parallel {
                stage('Build auth') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-auth-service:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-auth-service:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-auth-service:latest \\
                                    ./backend/auth-service
                                docker push ${REGISTRY}/rfc-auth-service:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-auth-service:latest
                            """
                        }
                    }
                }
                stage('Build user') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-user-service:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-user-service:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-user-service:latest \\
                                    ./backend/user-service
                                docker push ${REGISTRY}/rfc-user-service:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-user-service:latest
                            """
                        }
                    }
                }
                stage('Build task') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-task-service:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-task-service:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-task-service:latest \\
                                    ./backend/task-service
                                docker push ${REGISTRY}/rfc-task-service:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-task-service:latest
                            """
                        }
                    }
                }
                stage('Build project') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-project-service:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-project-service:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-project-service:latest \\
                                    ./backend/project-service
                                docker push ${REGISTRY}/rfc-project-service:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-project-service:latest
                            """
                        }
                    }
                }
                stage('Build conge') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-conge-service:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-conge-service:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-conge-service:latest \\
                                    ./backend/conge-service
                                docker push ${REGISTRY}/rfc-conge-service:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-conge-service:latest
                            """
                        }
                    }
                }
                stage('Build notif') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-notification-service:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-notification-service:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-notification-service:latest \\
                                    ./backend/notification-service
                                docker push ${REGISTRY}/rfc-notification-service:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-notification-service:latest
                            """
                        }
                    }
                }
                stage('Build gateway') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-api-gateway:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-api-gateway:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-api-gateway:latest \\
                                    ./backend/api-gateway
                                docker push ${REGISTRY}/rfc-api-gateway:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-api-gateway:latest
                            """
                        }
                    }
                }
                stage('Build frontend') {
                    steps {
                        retry(3) {
                            sh """
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-frontend:latest \\
                                    --build-arg BUILDKIT_INLINE_CACHE=1 \\
                                    --tag ${REGISTRY}/rfc-frontend:${IMAGE_TAG} \\
                                    --tag ${REGISTRY}/rfc-frontend:latest \\
                                    ./frontend
                                docker push ${REGISTRY}/rfc-frontend:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-frontend:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Security Scan (Trivy)') {
            when {
                expression { params.SKIP_DOCKER == false }
            }
            parallel {
                stage('Trivy auth') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-auth-service:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy user') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-user-service:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy task') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-task-service:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy project') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-project-service:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy conge') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-conge-service:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy notif') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-notification-service:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy gateway') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-api-gateway:${IMAGE_TAG}
                        """
                    }
                }
                stage('Trivy frontend') {
                    steps {
                        sh """
                            trivy image --exit-code 0 --severity HIGH,CRITICAL \
                                --ignore-unfixed --scanners vuln \
                                ${REGISTRY}/rfc-frontend:${IMAGE_TAG}
                        """
                    }
                }
            }
        }

        stage('Deploy') {
            when { expression { params.ROLLBACK == false } }
            steps {
                script {
                    if (params.ENV == 'prod') {
                        input message: "Confirmer le deploiement en PRODUCTION ?", ok: "Deployer"
                    }
                }
                sh """
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.${params.ENV}.yml pull
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.${params.ENV}.yml up -d --remove-orphans
                """
            }
        }

        stage('Rollback') {
            when { expression { params.ROLLBACK == true } }
            steps {
                echo "Rollback vers : ${env.PREV_TAG}"
                sh """
                    IMAGE_TAG=${env.PREV_TAG} docker-compose -f docker-compose.${params.ENV}.yml up -d --remove-orphans
                """
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
                    echo "Health check echoue apres 60s"
                    exit 1
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo "RFC Connect deploye — build #${env.BUILD_NUMBER} — version ${env.IMAGE_TAG}"
        }
        failure {
            echo "Echec — build #${env.BUILD_NUMBER}"
            sh "docker-compose -f docker-compose.${params.ENV}.yml logs --tail=50 || true"
        }
        always {
            echo "Pipeline termine — build #${env.BUILD_NUMBER}"
            cleanWs()
        }
    }
}