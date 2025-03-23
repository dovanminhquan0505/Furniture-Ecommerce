import React, { useState } from "react";
import { Form, FormGroup, Label, Input, FormText } from "reactstrap";
import { motion } from "framer-motion";
import "./refundform.css"; 

const RefundForm = ({ orderId, onRequestRefund, onCancel, loading }) => {
    const [refundReason, setRefundReason] = useState("");
    const [refundFiles, setRefundFiles] = useState([]);

    const handleFileChange = (e) => {
        setRefundFiles(Array.from(e.target.files));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onRequestRefund({ reason: refundReason, files: refundFiles });
        setRefundReason(""); // Reset form sau khi submit
        setRefundFiles([]);
    };

    return (
        <div className="refund-form-container">
            <h6 className="refund-form-title">Request Refund</h6>
            <Form onSubmit={handleSubmit} className="refund-form">
                <FormGroup className="refund-form-group">
                    <Label for="refundReason" className="refund-form-label">
                        Reason for Refund
                    </Label>
                    <Input
                        type="textarea"
                        id="refundReason"
                        name="refundReason"
                        rows={3}
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Please explain why you are requesting a refund"
                        required
                        className="refund-form-textarea"
                    />
                </FormGroup>
                <FormGroup className="refund-form-group">
                    <Label for="refundFiles" className="refund-form-label">
                        Upload Evidence (optional)
                    </Label>
                    <Input
                        type="file"
                        id="refundFiles"
                        name="refundFiles"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="refund-form-file"
                    />
                    <FormText className="refund-form-text">
                        {refundFiles.length > 0
                            ? `${refundFiles.length} file(s) selected`
                            : "Upload images or PDFs to support your request"}
                    </FormText>
                </FormGroup>
                <div className="refund-form-buttons">
                    <motion.button
                        whileTap={{ scale: 1.1 }}
                        type="submit"
                        className="refund-form-btn refund-form-btn-primary"
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit Request"}
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 1.1 }}
                        type="button"
                        className="refund-form-btn refund-form-btn-secondary"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </motion.button>
                </div>
            </Form>
        </div>
    );
};

export default RefundForm;