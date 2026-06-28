package models

import "time"

type WorkOrder struct {
	ID              int        `json:"id"`
	ContractorName  *string    `json:"contractor_name"`
	ContractorPhone *string    `json:"contractor_phone"`
	AEName          *string    `json:"ae_name"`
	AEPhone         *string    `json:"ae_phone"`
	AEEName         *string    `json:"aee_name"`
	AEEPhone        *string    `json:"aee_phone"`
	EEName          *string    `json:"ee_name"`
	EEPhone         *string    `json:"ee_phone"`
	CompletionDate  *time.Time `json:"completion_date"`
	DLPExpiryDate   *time.Time `json:"dlp_expiry_date"`
	DLPStatus       string     `json:"dlp_status"`
	DaysRemaining   *int       `json:"days_remaining"`
	SourceDocument  string     `json:"source_document"`
	SourceLabel     string     `json:"source_label"`
}
