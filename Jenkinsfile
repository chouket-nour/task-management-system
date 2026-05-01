pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    parameters {
        choice(name: 'ENV', choices: ['dev', 'staging', 'prod'], description: 'Environnement cible')
        booleanParam(name: 'ROLLBACK', defaultValue: false, description: 'Rollback manuel vers la révision précédente')
    }

    environment {
        REGISTRY                    = "nourchouket2000"
        IMAGE_TAG                   = "${env.BUILD_NUMBER}"
        BACKEND_SERVICES            = "auth-service,user-service,task-service,project-service,conge-service,notification-service,api-gateway"
        NPM_CONFIG_CACHE            = "/var/jenkins_home/.npm-cache"
        MONGOMS_DOWNLOAD_DIR        = "/var/jenkins_home/.cache/mongodb-binaries"
        MONGOMS_DISABLE_POSTINSTALL = "1"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=== Recuperation depuis GitHub ==='
                checkout scm
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
                                dir('backend/auth-service') {
                                    sh 'npm ci --prefer-offline'
                                }
                            }
                        }
                    }
                }
                stage('user') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/user-service') {
                                    sh 'npm ci --prefer-offline'
                                }
                            }
                        }
                    }
                }
                stage('task') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/task-service') {
                                    sh 'npm ci --prefer-offline'
                                }
                            }
                        }
                    }
                }
                stage('project') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/project-service') {
                                    sh 'npm ci --prefer-offline'
                                }
                            }
                        }
                    }
                }
                stage('conge') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/conge-service') {
                                    sh 'npm ci --prefer-offline'
                                }
                            }
                        }
                    }
                }
                stage('notif') {
                    steps {
                        timeout(time: 10, unit: 'MINUTES') {
                            retry(2) {
                                dir('backend/notification-service') {
                                    sh 'npm ci --prefer-offline'
                                }
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
                            error "Quality Gate FAILED : statut = ${qg.status} — voir http://192.168.1.20:9000/dashboard?id=rfc-connect"
                        }
                        echo "Quality Gate PASSED (statut : ${qg.status})"
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                echo '=== Connexion a Docker Hub ==='
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
            steps {
                echo '=== Pull cache des images latest ==='
                sh """
                    docker pull ${REGISTRY}/rfc-auth-service:latest         || true
                    docker pull ${REGISTRY}/rfc-user-service:latest         || true
                    docker pull ${REGISTRY}/rfc-task-service:latest         || true
                    docker pull ${REGISTRY}/rfc-project-service:latest      || true
                    docker pull ${REGISTRY}/rfc-conge-service:latest        || true
                    docker pull ${REGISTRY}/rfc-notification-service:latest || true
                    docker pull ${REGISTRY}/rfc-api-gateway:latest          || true
                    docker pull ${REGISTRY}/rfc-frontend:latest             || true
                """

                echo '=== Build & Push backend services ==='
                script {
                    def services = [
                        'auth-service',
                        'user-service',
                        'task-service',
                        'project-service',
                        'conge-service',
                        'notification-service',
                        'api-gateway'
                    ]
                    for (svc in services) {
                        def currentSvc = svc
                        retry(3) {
                            sh """
                                echo "--- Build ${currentSvc} ---"
                                docker build \\
                                    --cache-from ${REGISTRY}/rfc-${currentSvc}:latest \\
                                    --tag        ${REGISTRY}/rfc-${currentSvc}:${IMAGE_TAG} \\
                                    --tag        ${REGISTRY}/rfc-${currentSvc}:latest \\
                                    ./backend/${currentSvc}

                                echo "--- Push ${currentSvc} ---"
                                docker push ${REGISTRY}/rfc-${currentSvc}:${IMAGE_TAG}
                                docker push ${REGISTRY}/rfc-${currentSvc}:latest
                            """
                        }
                    }
                }

                echo '=== Build & Push frontend ==='
                retry(3) {
                    sh """
                        docker build \\
                            --cache-from ${REGISTRY}/rfc-frontend:latest \\
                            --tag        ${REGISTRY}/rfc-frontend:${IMAGE_TAG} \\
                            --tag        ${REGISTRY}/rfc-frontend:latest \\
                            ./frontend

                        docker push ${REGISTRY}/rfc-frontend:${IMAGE_TAG}
                        docker push ${REGISTRY}/rfc-frontend:latest
                    """
                }
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                script {
                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')

                    for (svc in services) {
                        def currentSvc = svc
                        retry(2) {
                            sh """
                                echo "Scan Trivy : ${currentSvc}..."
                                trivy image --exit-code 1 --severity HIGH,CRITICAL \
                                    ${REGISTRY}/rfc-${currentSvc}:${IMAGE_TAG}
                            """
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { params.ROLLBACK == false }
            }
            steps {
                script {
                    if (params.ENV == 'prod') {
                        input message: "Confirmer le deploiement en PRODUCTION ?",
                              ok: "Deployer"
                    }
                }
                echo '=== Deploiement ==='
                sh """
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.${params.ENV}.yml pull
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.${params.ENV}.yml up -d --remove-orphans
                """
            }
        }

        stage('Rollback') {
            when {
                expression { params.ROLLBACK == true }
            }
            steps {
                echo "Rollback vers la version precedente : ${env.PREV_TAG}"
                sh """
                    IMAGE_TAG=${env.PREV_TAG} docker-compose -f docker-compose.${params.ENV}.yml up -d --remove-orphans
                """
            }
        }

        stage('Health Check') {
            when {
                expression { params.ROLLBACK == false }
            }
            steps {
                echo '=== Verification des services ==='
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
                echo '=== Nettoyage Docker ==='
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo "RFC Connect deploye avec succes — build #${env.BUILD_NUMBER} — version ${env.IMAGE_TAG}"
        }
        failure {
            echo "Echec du pipeline — build #${env.BUILD_NUMBER}"
            sh """
                docker-compose -f docker-compose.${params.ENV}.yml logs --tail=50 || true
            """
        }
        always {
            echo "Pipeline termine — build #${env.BUILD_NUMBER}"
            cleanWs()
        }
    }
}