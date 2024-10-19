import React from 'react';
import './ProjectCard.scss';

const ProjectCard = () => {
  return (
    <div className="project-card">
      <div className="project-image">
        <img
          src="path-to-image.png" // Replace with the correct image path
          alt="Shawerr Project"
        />
      </div>
      <div className="project-info">
        <h2 className="project-title">Shawerr</h2>
        <p className="project-tech">
          Made with: <span>TypeScript</span> <span>SvelteKit</span> <span>Svelte</span>{' '}
          <span>TailwindCss</span> <span>Firebase</span>
        </p>
        <p className="project-description">
          Comprehensive consultant for rebuilding and establishing new products, safety
          inspection, and product evaluation.
        </p>
        <a href="your-live-link.com" className="project-link" target="_blank" rel="noopener noreferrer">
          <span>🔗 Live</span>
        </a>
      </div>
    </div>
  );
};

export default ProjectCard;
