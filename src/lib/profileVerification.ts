export type AccountStatus = 'pending' | 'documents_submitted' | 'approved' | 'rejected';
export type DocumentType = 'carte' | 'kbis' | 'rc_pro';
export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected';
export type DocumentWorkflowStatus = DocumentReviewStatus | 'missing';

export interface ProfileVerificationInput {
  activite_exercee?: string | null;
  documents_submitted_at?: string | null;
  carte_identite_url?: string | null;
  kbis_url?: string | null;
  rc_pro_url?: string | null;
  carte_identite_status?: string | null;
  kbis_status?: string | null;
  rc_pro_status?: string | null;
}

export interface DerivedDocumentState {
  type: DocumentType;
  label: string;
  hasDocument: boolean;
  reviewStatus: DocumentReviewStatus | null;
  workflowStatus: DocumentWorkflowStatus;
}

export interface DerivedProfileVerificationState {
  accountStatus: AccountStatus;
  hasActivity: boolean;
  documents: Record<DocumentType, DerivedDocumentState>;
  missingDocuments: DocumentType[];
  pendingDocuments: DocumentType[];
  approvedDocuments: DocumentType[];
  rejectedDocuments: DocumentType[];
}

const STATUS_FIELDS = {
  carte: 'carte_identite_status',
  kbis: 'kbis_status',
  rc_pro: 'rc_pro_status',
} as const;

const URL_FIELDS = {
  carte: 'carte_identite_url',
  kbis: 'kbis_url',
  rc_pro: 'rc_pro_url',
} as const;

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  carte: "Carte d'identite",
  kbis: 'KBIS',
  rc_pro: 'RC Pro',
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const normalizeReviewStatus = (
  status: string | null | undefined,
  hasDocument: boolean
): DocumentReviewStatus | null => {
  if (!hasDocument) {
    return null;
  }

  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    return status;
  }

  return 'pending';
};

export function deriveProfileVerificationState(
  input: ProfileVerificationInput
): DerivedProfileVerificationState {
  const hasActivity = isNonEmptyString(input.activite_exercee);

  const missingDocuments: DocumentType[] = [];
  const pendingDocuments: DocumentType[] = [];
  const approvedDocuments: DocumentType[] = [];
  const rejectedDocuments: DocumentType[] = [];

  const documents = (['carte', 'kbis', 'rc_pro'] as DocumentType[]).reduce(
    (acc, type) => {
      const urlValue = input[URL_FIELDS[type]];
      const hasDocument = isNonEmptyString(urlValue);
      const reviewStatus = normalizeReviewStatus(input[STATUS_FIELDS[type]], hasDocument);

      let workflowStatus: DocumentWorkflowStatus = 'missing';
      if (reviewStatus === 'pending') {
        workflowStatus = 'pending';
        pendingDocuments.push(type);
      } else if (reviewStatus === 'approved') {
        workflowStatus = 'approved';
        approvedDocuments.push(type);
      } else if (reviewStatus === 'rejected') {
        workflowStatus = 'rejected';
        rejectedDocuments.push(type);
      } else {
        missingDocuments.push(type);
      }

      acc[type] = {
        type,
        label: DOCUMENT_LABELS[type],
        hasDocument,
        reviewStatus,
        workflowStatus,
      };

      return acc;
    },
    {} as Record<DocumentType, DerivedDocumentState>
  );

  let accountStatus: AccountStatus = 'pending';
  const allRequiredDocumentsPresent = missingDocuments.length === 0;

  if (hasActivity && allRequiredDocumentsPresent) {
    if (approvedDocuments.length === 3) {
      accountStatus = 'approved';
    } else if (rejectedDocuments.length > 0) {
      accountStatus = 'rejected';
    } else {
      accountStatus = 'documents_submitted';
    }
  }

  return {
    accountStatus,
    hasActivity,
    documents,
    missingDocuments,
    pendingDocuments,
    approvedDocuments,
    rejectedDocuments,
  };
}

export function buildDocumentStatusPatch(state: DerivedProfileVerificationState): {
  carte_identite_status: DocumentReviewStatus | null;
  kbis_status: DocumentReviewStatus | null;
  rc_pro_status: DocumentReviewStatus | null;
} {
  return {
    carte_identite_status: state.documents.carte.reviewStatus,
    kbis_status: state.documents.kbis.reviewStatus,
    rc_pro_status: state.documents.rc_pro.reviewStatus,
  };
}

export function buildAccountStatusFields(
  state: DerivedProfileVerificationState,
  existingDocumentsSubmittedAt?: string | null,
  nowIso: string = new Date().toISOString()
): {
  account_status: AccountStatus;
  documents_submitted_at: string | null;
  validated_at: string | null;
} {
  if (state.accountStatus === 'pending') {
    return {
      account_status: 'pending',
      documents_submitted_at: null,
      validated_at: null,
    };
  }

  const documentsSubmittedAt = existingDocumentsSubmittedAt || nowIso;

  return {
    account_status: state.accountStatus,
    documents_submitted_at: documentsSubmittedAt,
    validated_at: state.accountStatus === 'approved' ? nowIso : null,
  };
}

export function toDocumentLabels(types: DocumentType[]): string[] {
  return types.map((type) => DOCUMENT_LABELS[type]);
}
