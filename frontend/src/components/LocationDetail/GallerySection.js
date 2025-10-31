
import React from "react";

const GallerySection = ({ location, imageMapper }) => {
  return (
    <section id="gallery-location" className="gallery-location mb-8">
      <h2 className="text-2xl font-semibold mb-4">Trải nghiệm tại địa điểm</h2>
      {location.experiences && location.experiences.length > 0 ? (
        <div className="gallery-location-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {location.experiences.map((exp, index) => (
            <div key={index}>
              {exp.image && (
                <img
                  src={imageMapper(exp.image)}
                  alt={`Trải nghiệm ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x200?text=Error+Loading+Image";
                  }}
                />
              )}
              <p>{exp.text || "Không có mô tả"}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Không có thông tin.</p>
      )}
    </section>
  );
};

export default GallerySection;