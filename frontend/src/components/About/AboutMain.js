import React from "react";
import AboutBanner from "./AboutBanner";
import AboutMission from "./AboutMission";
import AboutFeatures from "./AboutFeatures";
import AboutTeam from "./AboutTeam";
import AboutPartners from "./AboutPartners";

const AboutMain = () => (
  <div className="about-main">
    <AboutBanner />
    <AboutMission />
    <AboutFeatures />
    <AboutTeam />
    <AboutPartners />
  </div>
);

export default AboutMain;