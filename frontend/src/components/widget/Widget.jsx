import React from "react";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import "./widget.scss";

const Widget = ({ title, excerpt, onReadMore }) => {
  return (
    <div className="agriWidgetCard">
      <div className="cardHeader">
        <span className="categoryBadge">
          <MenuBookOutlinedIcon style={{ fontSize: 13 }} />
          Expert Advice
        </span>
      </div>
      <h3 className="blogTitle">{title}</h3>
      {excerpt && <p className="blogExcerpt">{excerpt}</p>}
      <div className="cardFooter">
        <button className="readMoreBtn" onClick={onReadMore}>
          <span>Read Insight</span>
          <ArrowForwardOutlinedIcon className="arrowIcon" style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
};

export default Widget;
