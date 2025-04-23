import React from "react";
import { Modal, Button } from "reactstrap";
import "../../styles/confirmModal.css";

const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} toggle={onClose} centered>
            <div className="confirm-modal">
                <h5 className="modal-title">Confirm Action</h5>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <Button color="secondary" onClick={onClose} className="modal-btn">
                        Cancel
                    </Button>
                    <Button color="primary" onClick={onConfirm} className="modal-btn">
                        Confirm
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;