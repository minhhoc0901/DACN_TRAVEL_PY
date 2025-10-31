import PropTypes from "prop-types";

const TravelSection = ({ location }) => (
  <section id="travel" className="travel-location">
    <h2>Hành trình đến địa điểm</h2>
    <h3>Cách di chuyển</h3>
    <div className="travel-details-location">
      <h4>Từ trung tâm TP. Tuy Hòa:</h4>
      <ul>
        {location.travel.fromTuyHoa.map((method, index) => (
          <li key={index}>
            <strong>{method.split(":")[0]}:</strong> {method.split(":")[1]}
          </li>
        ))}
      </ul>
      <h4>Từ nơi khác:</h4>
      <ul>
        {location.travel.fromElsewhere.map((method, index) => (
          <li key={index}>
            <strong>{method.split(":")[0]}:</strong> {method.split(":")[1]}
          </li>
        ))}
      </ul>
      <p>
        <strong>Giá vé tham quan:</strong>{" "}
        <span className="highlight-location">{location.travel.ticketPrice}</span>
      </p>
      <div className="tip">
        <h4>Mẹo nhỏ:</h4>
        <p>{location.travel.tip}</p>
      </div>
    </div>
  </section>
);

TravelSection.propTypes = {
  location: PropTypes.shape({
    travel: PropTypes.shape({
      fromTuyHoa: PropTypes.arrayOf(PropTypes.string).isRequired,
      fromElsewhere: PropTypes.arrayOf(PropTypes.string).isRequired,
      ticketPrice: PropTypes.string.isRequired,
      tip: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default TravelSection;