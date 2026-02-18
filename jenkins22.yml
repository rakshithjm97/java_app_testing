pipeline {
    agent any

    tools {
        nodejs 'node18'
    }

    stages {

        stage("Clean Workspace") {
            steps {
                deleteDir()
            }
        }

        stage("Checkout Code") {
            steps {
                git branch: 'main',
                    url: 'https://github.com/rakshithjm97/java_app_testing.git'
            }
        }

        stage("Build Application") {
            steps {
                echo "Building the application"

                dir('app') {
                    sh '''
                      node -v
                      npm -v
                      npm install
                      npm run build || echo "No build script, skipping"
                    '''
                }
            }
        }

        stage("Build & Push Docker Image") {
            steps {
                echo "Pushing to Docker Hub"

                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh '''
                      VERSION=$(node -p "require('./app/package.json').version")

                      echo "Using version: $VERSION"

                      echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                      docker build -t $DOCKER_USER/test_java:$VERSION .
                      docker build -t $DOCKER_USER/java-app:latest .

                      docker push $DOCKER_USER/test_java:$VERSION
                      docker push $DOCKER_USER/java-app:latest
                    '''
                }
            }
        }

        stage("Auto Semantic Version Bump") {

            when {
                branch 'main'
            }

            steps {

                withCredentials([usernamePassword(
                    credentialsId: 'github-creds',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {

                    sh '''
                      git config user.name "Jenkins Bot"
                      git config user.email "jenkins@local.com"

                      FILE="app/package.json"

                      CURRENT=$(node -p "require('./$FILE').version")

                      echo "Current version: $CURRENT"

                      IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

                      PATCH=$((PATCH+1))

                      NEW_VERSION="$MAJOR.$MINOR.$PATCH"

                      echo "New version: $NEW_VERSION"

                      node -e "
                      const fs=require('fs');
                      const f='$FILE';
                      const p=require('./'+f);
                      p.version='$NEW_VERSION';
                      fs.writeFileSync(f, JSON.stringify(p,null,2));
                      "

                      git add $FILE

                      git commit -m "chore: bump version to $NEW_VERSION [skip ci]" || echo "No changes"

                      git push https://$GIT_USER:$GIT_TOKEN@github.com/rakshithjm97/java_app_testing.git main
                    '''
                }
            }
        }
    }
}
