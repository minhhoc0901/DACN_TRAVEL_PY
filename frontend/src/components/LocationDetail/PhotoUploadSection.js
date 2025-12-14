import PropTypes from "prop-types";
import ImageUploading from "react-images-uploading";

const PhotoUploadSection = ({ images, setImages, maxNumber }) => (
  <section id="photo-upload" className="photo-upload">
    <h2>Chia sẻ hình ảnh của bạn</h2>
    <ImageUploading
      multiple
      value={images}
      onChange={(imageList) => setImages(imageList)}
      maxNumber={maxNumber}
      dataURLKey="data_url"
    >
      {({
        imageList,
        onImageUpload,
        onImageRemoveAll,
        onImageUpdate,
        onImageRemove,
        isDragging,
        dragProps,
      }) => (
        <div className="upload__image-wrapper">
          <button
            style={isDragging ? { backgroundColor: "red", color: "white" } : { backgroundColor: "blue", color: "white" }}
            onClick={onImageUpload}
            {...dragProps}
          >
            Nhấn hoặc thả ảnh tại đây
          </button>
          <button
            style={{ backgroundColor: "red", color: "white" }}
            onClick={onImageRemoveAll}
          >
            Xóa tất cả ảnh
          </button>
          <div className="image-grid">
            {imageList.map((image, index) => (
              <div key={index} className="image-item">
                <img
                  src={image["data_url"]}
                  alt=""
                />
                <div className="image-item__btn-wrapper">
                  <button
                    style={{ backgroundColor: "blue", color: "white" }}
                    onClick={() => onImageUpdate(index)}
                  >
                    Cập nhật
                  </button>
                  <button
                    style={{ backgroundColor: "red", color: "white" }}
                    onClick={() => onImageRemove(index)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ImageUploading>
  </section>
);

PhotoUploadSection.propTypes = {
  images: PropTypes.array.isRequired,
  setImages: PropTypes.func.isRequired,
  maxNumber: PropTypes.number.isRequired,
};

export default PhotoUploadSection;