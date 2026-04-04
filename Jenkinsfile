pipeline {
    agent any

    environment {
        DOCKER_USER = credentials('docker-username')
        DOCKER_PASS = credentials('docker-password')
    }

    stages {

        stage('Checkout') {
            steps {
                echo '=== Récupération depuis GitLab ==='
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
                stage('Test auth')   { steps { dir('backend/auth-service')        { sh 'npm test' } } }
                stage('Test user')   { steps { dir('backend/user-service')        { sh 'npm test' } } }
                stage('Test task')   { steps { dir('backend/task-service')        { sh 'npm test' } } }
                stage('Test project'){ steps { dir('backend/project-service')     { sh 'npm test' } } }
                stage('Test conge')  { steps { dir('backend/conge-service')       { sh 'npm test' } } }
                stage('Test notif')  { steps { dir('backend/notification-service'){ sh 'npm test' } } }
            }
        }

        stage('Build Docker') {
            steps {
                echo '=== Build des images Docker ==='
                sh 'docker-compose build'
            }
        }

        stage('Docker Login & Push') {
            steps {
                echo '=== Push vers Docker Hub ==='
                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                sh 'docker-compose push'
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Déploiement des services ==='
                sh 'docker-compose down --remove-orphans'
                sh 'docker-compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                echo '=== Vérification des services ==='
                sh 'sleep 15'
                
                // Vérifie un endpoint (à adapter selon ton API)
                sh '''
                curl -f http://localhost:5000/health || exit 1
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
            echo ' RFC Connect déployé avec succès !' 
        }
        failure {
            echo '❌ Échec du pipeline'
            sh 'docker-compose logs --tail=50'
        }
    }
}