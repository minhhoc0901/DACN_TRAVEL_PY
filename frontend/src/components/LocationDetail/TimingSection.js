import PropTypes from "prop-types";

const TimingSection = ({ location }) => (
  <section id="timing" className="timing">
    <h2>Thời điểm lý tưởng</h2>
    <ul>
      {location.bestTime.map((time, index) => (
        <li key={index}>
          <strong>{time.split(":")[0]}:</strong> {time.split(":")[1]}
        </li>
      ))}
    </ul>
  </section>
);

TimingSection.propTypes = {
  location: PropTypes.shape({
    bestTime: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

export default TimingSection;