import PropTypes from "prop-types";

const TipsSection = ({ location }) => (
  <section id="tips" className="tips">
    <h2>Lưu ý khi tham quan</h2>
    <ul>
      {location.tips.map((tip, index) => (
        <li key={index}>{tip}</li>
      ))}
    </ul>
  </section>
);

TipsSection.propTypes = {
  location: PropTypes.shape({
    tips: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

export default TipsSection;