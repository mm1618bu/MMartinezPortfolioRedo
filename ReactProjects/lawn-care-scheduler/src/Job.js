const Job = ({ job }) => {
    return (
      <div>
        <h3>{job.name}</h3>
        <p>Location: {job.location}</p>
        <p>Skill Required: {job.skill}</p>
        <p>Price: ${job.price}</p>
      </div>
    );
  };
  
  export default Job;
  