import React from 'react';
import Header from './components/Header';
import MainSection from './components/MainSection';
import AboutMe from './components/AboutMe';
import Skills from './components/Skills';
import ProjectCard from './components/ProjectCard';
import Footer from './components/Footer';

function App() {
  const projects = [
    {
      title: "YouTube Clone",
      technologies: ["React", "Supabase", "PostgreSQL", "Node.js"],
      description: "A production-ready YouTube clone with video management, intelligent search, personalized recommendations, and creator tools.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/youtube-clone"
    },
    {
      title: "Lawn Care Scheduler",
      technologies: ["React", "JavaScript", "CSS"],
      description: "A scheduling application for managing lawn care appointments and employee assignments.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/lawn-care-scheduler"
    },
    {
      title: "Gradebook",
      technologies: ["React", "JavaScript", "CSS"],
      description: "A student grade management system for tracking and managing student performance.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/gradebook"
    },
    {
      title: "Password Generator",
      technologies: ["React", "JavaScript", "CSS"],
      description: "A secure password generator with customizable options for creating strong passwords.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/password-generator"
    },
    {
      title: "Warehouse Employee Manager",
      technologies: ["React", "JavaScript", "CSS"],
      description: "An employee management system for warehouse operations and staff coordination.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/warehouse-employee-manager"
    },
    {
      title: "Taskboard",
      technologies: ["React", "JavaScript", "CSS"],
      description: "A task management board for organizing and tracking project tasks.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/taskboard"
    },
    {
      title: "Secret Santa",
      technologies: ["React", "JavaScript", "CSS"],
      description: "A Secret Santa gift exchange organizer for managing holiday gift exchanges.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/secret-santa"
    },
    {
      title: "Podcast App",
      technologies: ["React", "Vite", "JavaScript"],
      description: "A podcast player application for discovering and listening to podcasts.",
      githubLink: "https://github.com/mm1618bu/MMartinezPortfolioRedo/tree/main/ReactProjects/podcast-app"
    }
  ];

  return (
    <div className="App">
      <Header />
      <MainSection />
      <AboutMe />
      <Skills />
      <section className="projects-section">
        {projects.map((project, index) => (
          <ProjectCard 
            key={index}
            title={project.title}
            technologies={project.technologies}
            description={project.description}
            liveLink={project.liveLink}
            githubLink={project.githubLink}
            imageSrc={project.imageSrc}
          />
        ))}
      </section>
      <Footer />
    </div>
  );
}

export default App;
