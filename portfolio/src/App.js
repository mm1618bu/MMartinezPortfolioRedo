import React from 'react';
import Header from './components/Header';
import MainSection from './components/MainSection';
import AboutMe from './components/AboutMe';
import Skills from './components/Skills';
import ProjectCard from './components/ProjectCard';
import Footer from './components/Footer';

function App() {
  return (
    <div className="App">
      <Header />
      <MainSection />
      <AboutMe />
      <Skills />
      <ProjectCard />
      <Footer />
    </div>
  );
}

export default App;
