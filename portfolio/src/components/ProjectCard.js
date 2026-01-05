import React from 'react';
import './ProjectCard.scss';

const ProjectCard = ({ title, technologies, description, liveLink, githubLink, imageSrc }) => {
  return (
    <div className="project-card">
      <div className="project-image">
        <img
          src={imageSrc || "path-to-image.png"} // Replace with the correct image path
          alt={`${title} Project`}
        />
      </div>
      <div className="project-info">
        <h2 className="project-title">
          <a href={githubLink || liveLink} target="_blank" rel="noopener noreferrer">
            {title}
          </a>
        </h2>
        <p className="project-tech">
          Made with: {technologies.map((tech, index) => (
            <span key={index}>{tech}</span>
          ))}
        </p>
        <p className="project-description">
          {description}
        </p>
        <div className="project-links">
          {liveLink && (
            <a href={liveLink} className="project-link" target="_blank" rel="noopener noreferrer">
              <span>🔗 Live</span>
            </a>
          )}
          {githubLink && (
            <a href={githubLink} className="project-link" target="_blank" rel="noopener noreferrer">
              <span>💻 GitHub</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
