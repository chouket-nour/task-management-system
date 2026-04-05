pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }

    environment {
        DOCKER_USER = credentials('docker-username')
        DOCKER_PASS = credentials('docker-password')
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
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
                stage('auth')   { steps { dir('backend/auth-service')         { sh 'npm ci' } } }
                stage('user')   { steps { dir('backend/user-service')         { sh 'npm ci' } } }
                stage('task')   { steps { dir('backend/task-service')         { sh 'npm ci' } } }
                stage('project'){ steps { dir('backend/project-service')      { sh 'npm ci' } } }
                stage('conge')  { steps { dir('backend/conge-service')        { sh 'npm ci' } } }
                stage('notif')  { steps { dir('backend/notification-service') { sh 'npm ci' } } }
            }
        }

        stage('Tests') {
            failFast true
            parallel {
                stage('Test auth')   { 
                    steps { dir('backend/auth-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/auth-service/junit.xml' } }
                }
                stage('Test user')   { 
                    steps { dir('backend/user-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/user-service/junit.xml' } }
                }
                stage('Test task')   { 
                    steps { dir('backend/task-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/task-service/junit.xml' } }
                }
                stage('Test project'){ 
                    steps { dir('backend/project-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/project-service/junit.xml' } }
                }
                stage('Test conge')  { 
                    steps { dir('backend/conge-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/conge-service/junit.xml' } }
                }
                stage('Test notif')  { 
                    steps { dir('backend/notification-service') { sh 'npm test' } }
                    post { always { junit allowEmptyResults: true, testResults: 'backend/notification-service/junit.xml' } }
                }
            }
        }

        stage('Build Docker') {
            steps {
                echo '=== Build des images Docker ==='
                sh 'docker-compose build'
            }
        }

        stage('Push Docker Hub') {
            steps {
                echo '=== Push vers Docker Hub ==='
                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                sh 'docker-compose push'
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Déploiement ==='
                sh 'docker-compose down --remove-orphans'
                sh 'docker-compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                echo '=== Vérification des services ==='
                sh '''
                    for i in $(seq 1 12); do
                        curl -sf http://localhost:5000/health && echo " API OK" && exit 0
                        echo "Tentative $i/12 — attente 5s..."
                        sleep 5
                    done
                    echo " Health check échoué"
                    exit 1
                '''
            }
        }

        stage('Cleanup') {
            steps {
                echo '=== Nettoyage Docker ==='
                sh 'docker system prune -f'
            }
        }
    }

    post {
        success {
            echo " RFC Connect déployé avec succès — build #${env.BUILD_NUMBER}"
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