pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        DOCKER_USER = credentials('docker-username')
        DOCKER_PASS = credentials('docker-password')
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
        REGISTRY    = "nourchouket2000"
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=== Récupération depuis GitHub ==='
                checkout scm
            }
        }

        stage('Install') {
            failFast true
            parallel {
                stage('auth')    { steps { dir('backend/auth-service')         { sh 'npm ci' } } }
                stage('user')    { steps { dir('backend/user-service')         { sh 'npm ci' } } }
                stage('task')    { steps { dir('backend/task-service')         { sh 'npm ci' } } }
                stage('project') { steps { dir('backend/project-service')      { sh 'npm ci' } } }
                stage('conge')   { steps { dir('backend/conge-service')        { sh 'npm ci' } } }
                stage('notif')   { steps { dir('backend/notification-service') { sh 'npm ci' } } }
            }
        }

        stage('Prepare MongoDB Binary') {
            steps {
                echo '=== Pré-téléchargement du binaire MongoDB ==='
                dir('backend/auth-service') {
                    sh '''
                        node -e "const { MongoMemoryServer } = require('mongodb-memory-server'); \
                        MongoMemoryServer.create().then(s => { console.log('MongoDB binary OK'); s.stop(); })"
                    '''
                }
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

        stage('Docker Login') {
            steps {
                echo '=== Connexion à Docker Hub ==='
                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
            }
        }

        stage('Build & Push Docker') {
            steps {
                echo '=== Build des images Docker avec cache ==='
                sh """
                    # Pull les images latest pour servir de cache (|| true = pas d'erreur si 1er build)
                    docker pull \${REGISTRY}/rfc-auth-service:latest         || true
                    docker pull \${REGISTRY}/rfc-user-service:latest         || true
                    docker pull \${REGISTRY}/rfc-task-service:latest         || true
                    docker pull \${REGISTRY}/rfc-project-service:latest      || true
                    docker pull \${REGISTRY}/rfc-conge-service:latest        || true
                    docker pull \${REGISTRY}/rfc-notification-service:latest || true
                    docker pull \${REGISTRY}/rfc-api-gateway:latest          || true
                    docker pull \${REGISTRY}/rfc-frontend:latest             || true
                """

                sh """
                    # Build backend services avec cache
                    for SERVICE in auth-service user-service task-service project-service conge-service notification-service api-gateway; do
                        echo "--- Build \${SERVICE} ---"
                        docker build \\
                            --cache-from \${REGISTRY}/rfc-\${SERVICE}:latest \\
                            --tag \${REGISTRY}/rfc-\${SERVICE}:\${IMAGE_TAG} \\
                            --tag \${REGISTRY}/rfc-\${SERVICE}:latest \\
                            ./backend/\${SERVICE}
                    done

                    # Build frontend séparément
                    echo "--- Build frontend ---"
                    docker build \\
                        --cache-from \${REGISTRY}/rfc-frontend:latest \\
                        --tag \${REGISTRY}/rfc-frontend:\${IMAGE_TAG} \\
                        --tag \${REGISTRY}/rfc-frontend:latest \\
                        ./frontend
                """

                sh """
                    # Push toutes les images (tag versioned + latest)
                    for SERVICE in auth-service user-service task-service project-service conge-service notification-service api-gateway frontend; do
                        echo "--- Push \${SERVICE} ---"
                        docker push \${REGISTRY}/rfc-\${SERVICE}:\${IMAGE_TAG}
                        docker push \${REGISTRY}/rfc-\${SERVICE}:latest
                    done
                """
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Déploiement ==='
                sh '''
                    docker-compose pull
                    docker-compose up -d --remove-orphans
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo '=== Vérification des services ==='
                sh '''
                    for i in $(seq 1 12); do
                        curl -sf http://api-gateway:5000/health && echo "API OK" && exit 0
                        echo "Tentative $i/12 — attente 5s..."
                        sleep 5
                    done
                    echo "Health check échoué"
                    exit 1
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo '=== Nettoyage Docker (cache préservé) ==='
                sh 'docker image prune -f'
            }
        }
    }

    post {
        success {
            echo "RFC Connect déployé avec succès — build #${env.BUILD_NUMBER}"
        }
        failure {
            echo " Échec du pipeline — build #${env.BUILD_NUMBER}"
            sh 'docker-compose logs --tail=50'
        }
        always {
            echo "Pipeline terminé — build #${env.BUILD_NUMBER}"
        }
    }
}