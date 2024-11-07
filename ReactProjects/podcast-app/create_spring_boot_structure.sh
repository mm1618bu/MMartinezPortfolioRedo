#!/bin/bash

# Root project directory (modify as needed)
PROJECT_DIR="SpringBootBackend"
PACKAGE_DIR="$PROJECT_DIR/src/main/java/com/example/podcastapp"

# Create main project directories
mkdir -p $PROJECT_DIR
mkdir -p $PROJECT_DIR/src/main/resources

# Create subdirectories for source code
mkdir -p $PACKAGE_DIR/controller
mkdir -p $PACKAGE_DIR/service
mkdir -p $PACKAGE_DIR/repository
mkdir -p $PACKAGE_DIR/model

# Create essential files
touch $PROJECT_DIR/pom.xml                      # Maven build file
touch $PROJECT_DIR/src/main/resources/application.properties  # Properties file

# Create Java classes
touch $PACKAGE_DIR/PodcastAppApplication.java   # Main Spring Boot application
touch $PACKAGE_DIR/controller/PodcastController.java # Controller
touch $PACKAGE_DIR/service/PodcastService.java  # Service class
touch $PACKAGE_DIR/repository/PodcastRepository.java # Repository
touch $PACKAGE_DIR/model/Podcast.java           # Entity class

# Output structure
echo "Spring Boot structure created in $PROJECT_DIR"
