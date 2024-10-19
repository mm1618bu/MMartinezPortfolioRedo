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
          <span>JavaScript</span>
          <span>TypeScript</span>
          <span>React</span>
          <span>Next</span>
          <span>Redux</span>
          <span>Astro</span>
          <span>Recoil</span>
          <span>GraphQL</span>
          <span>Apollo</span>
          <span>Firebase</span>
        </div>
      </div>

      <div className="skills-section">
        <h2>Styling & Design</h2>
        <div className="skills-grid">
          <span>CSS</span>
          <span>SASS</span>
          <span>BootStrap</span>
          <span>Tailwind CSS</span>
          <span>CSS Module</span>
          <span>Figma</span>
          <span>Styled-Components</span>
        </div>
      </div>

      <div className="skills-section">
        <h2>Miscellaneous</h2>
        <div className="skills-grid">
          <span>Git</span>
          <span>Jest</span>
          <span>Cypress</span>
          <span>Playwright</span>
          <span>react-testing-library</span>
          <span>Webpack</span>
          <span>UI/UX design processes</span>
          <span>REST APIs</span>
        </div>
      </div>
    </div>
  );
};

export default Skills;
