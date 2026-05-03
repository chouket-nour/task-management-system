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

        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '=== Recuperation depuis GitHub ==='
                checkout scm
                sh 'node --version'
                sh 'npm --version'
            }
        }

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
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

      
        // ─────────────────────────────────────────────
        stage('Build & Push Docker') {
            when {
                expression { params.SKIP_DOCKER == false }
            }
            steps {
                script {

                    // 1 Setup buildx builder une seule fois
                    sh '''
                        docker buildx create --use --name rfc-builder \
                            --driver-opt network=host 2>/dev/null || \
                        docker buildx use rfc-builder
                        docker buildx inspect --bootstrap
                    '''

                    // 2️ Construction de la liste complète des services
                    def services = env.BACKEND_SERVICES.split(',').toList()
                    services.add('frontend')

                    // 3️ Loop dynamique → génère les stages parallèles
                    def buildStages = [:]

                    services.each { service ->
                        def svc     = service.trim()
                        def context = (svc == 'frontend') ? './frontend' : "./backend/${svc}"

                        buildStages["Build+Push ${svc}"] = {
                            retry(2) {
                                sh """
                                    docker buildx build \
                                        --builder rfc-builder \
                                        --platform linux/amd64 \
                                        --cache-from type=registry,ref=${REGISTRY}/rfc-${svc}:cache \
                                        --cache-to   type=registry,ref=${REGISTRY}/rfc-${svc}:cache,mode=max \
                                        --tag ${REGISTRY}/rfc-${svc}:${IMAGE_TAG} \
                                        --tag ${REGISTRY}/rfc-${svc}:latest \
                                        --push \
                                        ${context}
                                """
                            }
                        }
                    }

                    // 4️ Lancement en parallèle (safe avec buildx)
                    parallel buildStages
                }
            }
        }

        // ─────────────────────────────────────────────
        //  Security Scan : loop dynamique 
        // ─────────────────────────────────────────────
        stage('Security Scan (Trivy)') {
            when {
                expression { params.SKIP_DOCKER == false }
            }
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

        // ─────────────────────────────────────────────
        stage('Deploy') {
            when { expression { params.ROLLBACK == false } }
            steps {
                script {
                    if (params.ENV == 'prod') {
                        input message: "Confirmer le deploiement en PRODUCTION ?", ok: "Deployer"
                    }
                }
                sh """
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml pull
                    IMAGE_TAG=${IMAGE_TAG} docker-compose -f docker-compose.yml up -d --remove-orphans
                """
            }
        }

        // ─────────────────────────────────────────────
        stage('Rollback') {
            when { expression { params.ROLLBACK == true } }
            steps {
                echo "Rollback vers : ${env.PREV_TAG}"
                sh """
                    IMAGE_TAG=${env.PREV_TAG} docker-compose -f docker-compose.yml up -d --remove-orphans
                """
            }
        }

        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        stage('Cleanup') {
            steps {
                sh '''
                    docker buildx rm rfc-builder 2>/dev/null || true
                    docker image prune -f
                '''
            }
        }
    }

    // ─────────────────────────────────────────────
    post {
        success {
            echo " RFC Connect deploye — build #${env.BUILD_NUMBER} — version ${env.IMAGE_TAG}"
        }
        failure {
            echo " Echec — build #${env.BUILD_NUMBER}"
            sh "docker-compose -f docker-compose.yml logs --tail=50 || true"
        }
        always {
            echo "Pipeline termine — build #${env.BUILD_NUMBER}"
            cleanWs()
        }
    }
}