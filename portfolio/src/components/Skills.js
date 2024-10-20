import React from 'react';
import './Skills.scss';

const Skills = () => {
  return (
    <div className="skills">
      <h1>Skills</h1>
      
      <div className="skills-section">
        <h2>Front End</h2>
        <div className="skills-grid">
          <span>HTML</span>
          <span>CSS</span>
          <span>SCSS</span>
          <span>Tailwind CSS</span>
          <span>Bootstrap</span>
          <span>Material UI</span>
          <span>JavaScript</span>
          <span>React</span>
          <span>Angular</span>
          <span>Next.js</span>
          <span>React Native</span>
        </div>
      </div>

      <div className="skills-section">
        <h2>Back End</h2>
        <div className="skills-grid">
          <span>Node.js</span>
          <span>PHP</span>
          <span>SQL</span>
          <span>MongoDB</span>
          <span>Redis</span>
          <span>Celery</span>
          <span>PubSub</span>
          <span>AWS</span>
          <span>Terraform</span>
          <span>Docker</span>
          <span>Java</span>
          <span>C</span>
          <span>Rest APIs</span>
        </div>
      </div>

      <div className="skills-section">
        <h2>Miscellaneous</h2>
        <div className="skills-grid">
          <span>Netlify</span>
          <span>Git</span>
          <span>Webpack</span>
          <span>cPanel</span>
          <span>Linux</span>
          <span>Adobe Photoshop</span>
          <span>Adobe DreamSpark</span>
          <span>Webflow</span>
          <span>Wordpress</span>
        </div>
      </div>
    </div>
  );
};

export default Skills;
