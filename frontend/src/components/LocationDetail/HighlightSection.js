
import React from "react";

const HighlightSection = ({ location, imageMapper }) => {
  return (
    <section id="highlight-location" className="highlight-location mb-8">
      <h2 className="text-2xl font-semibold mb-4">Vì sao bạn nên ghé thăm?</h2>
      <div className="highlight-location-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xl font-medium">{location.whyVisit?.architecture?.title || "Không có tiêu đề"}</h3>
          <p>{location.whyVisit?.architecture?.text || "Không có thông tin"}</p>
          {location.whyVisit?.architecture?.image && (
            <img
              src={imageMapper(location.whyVisit.architecture.image)}
              alt="Kiến trúc"
              className="w-full h-48 object-cover rounded-lg mt-2"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/300x200?text=Error+Loading+Image";
              }}
            />
          )}
        </div>
      </div>
      <p className="mt-4">{location.whyVisit?.culture || "Không có thông tin"}</p>
    </section>
  );
};

export default HighlightSection;