import React from "react";
import "./SellerModal.css";

const SellerModal = ({ isOpen, onClose, seller }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="seller-modal-content">
                <button className="modal-close-btn" onClick={onClose}>
                    &times;
                </button>
                <div className="seller-modal-body">
                    <h2 className="seller-modal-title">Seller Information</h2>
                    {seller ? (
                        <div className="seller-details">
                            <div className="seller-detail-item">
                                <span className="detail-label">Store Name:</span>
                                <span className="detail-value">{seller.storeName || "N/A"}</span>
                            </div>
                            <div className="seller-detail-item">
                                <span className="detail-label">Owner:</span>
                                <span className="detail-value">{seller.fullName || "N/A"}</span>
                            </div>
                            <div className="seller-detail-item">
                                <span className="detail-label">Phone:</span>
                                <span className="detail-value">{seller.phoneNumber || "N/A"}</span>
                            </div>
                            <div className="seller-detail-item">
                                <span className="detail-label">Email:</span>
                                <span className="detail-value">{seller.storeEmail || seller.email || "N/A"}</span>
                            </div>
                            <div className="seller-detail-item">
                                <span className="detail-label">Address:</span>
                                <span className="detail-value">{seller.address ? `${seller.address}, ${seller.city || ""}` : "N/A"}</span>
                            </div>
                            <div className="seller-detail-item">
                                <span className="detail-label">Description:</span>
                                <span className="detail-value">{seller.storeDescription || "No description available."}</span>
                            </div>
                        </div>
                    ) : (
                        <p>No seller information available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerModal;