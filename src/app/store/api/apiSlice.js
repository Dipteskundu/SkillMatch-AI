import { useMemo } from "react";
import { createApi } from "@reduxjs/toolkit/query/react";
import api from "../../lib/apiClient";
import { useAppSelector } from "../hooks";

/**
 * All requests go through the shared axios client so the Firebase ID-token
 * interceptor (and the 500-swallowing response interceptor) still apply.
 */
async function axiosBaseQuery(args) {
  const { url, method = "GET", body, params } =
    typeof args === "string" ? { url: args } : args;
  try {
    const response = await api.request({ url, method, data: body, params });
    return { data: response.data };
  } catch (err) {
    return {
      error: {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      },
    };
  }
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery,
  tagTypes: [
    "Notifications",
    "jobs",
    "savedJobs",
    "applications",
    "Learning",
    "Billing",
    "Compliance",
    "ApiKeys",
  ],
  endpoints: (builder) => ({
    /* ── Notifications ── */
    getNotifications: builder.query({
      query: (uid) => `/api/notifications/${uid}`,
      providesTags: (result, error, uid) => [{ type: "Notifications", id: uid }],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/api/notifications/${id}/read`, method: "PATCH" }),
      // apiClient resolves HTTP 500s into `{ success: false }` bodies — don't
      // invalidate (refetch) in that case.
      invalidatesTags: (result) => (result?.success ? ["Notifications"] : []),
    }),
    markAllNotificationsRead: builder.mutation({
      query: (uid) => ({
        url: `/api/notifications/read-all/${uid}`,
        method: "PATCH",
      }),
      invalidatesTags: (result) => (result?.success ? ["Notifications"] : []),
    }),

    /* ── Jobs ── */
    getJobs: builder.query({
      query: () => "/api/jobs",
      providesTags: ["jobs"],
    }),
    getSavedJobs: builder.query({
      query: (uid) => `/api/jobs/saved/${uid}`,
      providesTags: ["savedJobs"],
    }),
    saveJob: builder.mutation({
      query: ({ jobId, uid, email }) => ({
        url: `/api/jobs/${jobId}/save`,
        method: "POST",
        data: { uid, email },
      }),
      invalidatesTags: ["savedJobs"],
    }),
    unsaveJob: builder.mutation({
      query: (savedId) => ({
        url: `/api/jobs/saved/${savedId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["savedJobs"],
    }),
    getCandidateDashboard: builder.query({
      query: (uid) => `/api/dashboard/candidate/${uid}`,
      providesTags: ["applications"],
    }),
    preApplyCheck: builder.mutation({
      query: ({ jobId, uid }) => ({
        url: `/api/jobs/${jobId}/pre-apply-check`,
        method: "POST",
        data: { uid },
      }),
      invalidatesTags: (result) =>
        result?.allowed ? ["jobs", "applications"] : [],
    }),

    /* ── Recruiter AI Copilot ──────────────────────────────────────────
     * Same endpoints the my-jobs / applicants pages fetch by hand, exposed
     * as queries so the copilot page gets loading + error states for free. */
    getRecruiterJobs: builder.query({
      query: (uid) => `/api/jobs/my-jobs/${uid}`,
      providesTags: ["jobs"],
    }),
    getRecruiterApplications: builder.query({
      query: (uid) => `/api/applications/recruiter/${uid}`,
      providesTags: ["applications"],
    }),
    copilotPipelineSummary: builder.mutation({
      query: ({ uid, jobId }) => ({
        url: "/api/copilot/pipeline-summary",
        method: "POST",
        data: jobId ? { uid, jobId } : { uid },
      }),
    }),
    copilotOutreachDraft: builder.mutation({
      query: ({ uid, applicationId, tone }) => ({
        url: "/api/copilot/outreach-draft",
        method: "POST",
        data: tone ? { uid, applicationId, tone } : { uid, applicationId },
      }),
    }),
    copilotInterviewQuestions: builder.mutation({
      query: ({ uid, jobId, applicationId }) => ({
        url: "/api/copilot/interview-questions",
        method: "POST",
        data: applicationId ? { uid, jobId, applicationId } : { uid, jobId },
      }),
    }),

    /* ── SkillForge Learning Hub (Phase 4) ─────────────────────────────
     * All responses share the `{ success, data }` envelope; 403s carry
     * coded reasons (FREE_PATH_LIMIT / DAILY_LESSON_LIMIT / QUIZ_LOCKED)
     * that pages surface explicitly. Every mutation bumps the "Learning"
     * tag so catalog, path, progress and lesson state stay in sync. */
    getLearningCatalog: builder.query({
      query: () => "/api/learning/catalog",
      providesTags: ["Learning"],
    }),
    enrollLearningPath: builder.mutation({
      query: ({ pathId }) => ({
        url: `/api/learning/paths/${pathId}/enroll`,
        method: "POST",
      }),
      invalidatesTags: (result) => (result?.success ? ["Learning"] : []),
    }),
    releaseLearningPath: builder.mutation({
      query: ({ pathId }) => ({
        url: `/api/learning/paths/${pathId}/enroll`,
        method: "DELETE",
      }),
      invalidatesTags: (result) => (result?.success ? ["Learning"] : []),
    }),
    getLearningPath: builder.query({
      query: (pathId) => `/api/learning/paths/${pathId}`,
      providesTags: ["Learning"],
    }),
    getLearningLesson: builder.query({
      query: ({ pathId, lessonId }) =>
        `/api/learning/paths/${pathId}/lessons/${lessonId}`,
      providesTags: ["Learning"],
    }),
    completeLearningLesson: builder.mutation({
      query: ({ pathId, lessonId }) => ({
        url: `/api/learning/paths/${pathId}/lessons/${lessonId}/complete`,
        method: "POST",
      }),
      invalidatesTags: (result) => (result?.success ? ["Learning"] : []),
    }),
    getLearningQuiz: builder.query({
      query: (pathId) => `/api/learning/paths/${pathId}/quiz`,
      providesTags: ["Learning"],
    }),
    submitLearningQuiz: builder.mutation({
      query: ({ pathId, answers }) => ({
        url: `/api/learning/paths/${pathId}/quiz/submit`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: (result) => (result?.success ? ["Learning"] : []),
    }),
    getLearningProgress: builder.query({
      query: () => "/api/learning/progress",
      providesTags: ["Learning"],
    }),
    matchLearningPaths: builder.mutation({
      query: (skills) => ({
        url: "/api/learning/match-paths",
        method: "POST",
        body: { skills },
      }),
    }),

    /* ── Billing (Phase 5 — env-gated; see configured flag) ── */
    getPlans: builder.query({
      query: () => "/api/billing/plans",
      providesTags: ["Billing"],
    }),
    getSubscription: builder.query({
      query: () => "/api/billing/subscription",
      providesTags: ["Billing"],
    }),
    createCheckout: builder.mutation({
      query: () => ({
        url: "/api/billing/checkout",
        method: "POST",
        body: { planId: "pro" },
      }),
    }),
    openBillingPortal: builder.mutation({
      query: () => ({ url: "/api/billing/portal", method: "POST" }),
    }),

    /* ── Compliance (Phase 5) ── */
    getDisclosure: builder.query({
      query: () => "/api/compliance/disclosure",
      providesTags: ["Compliance"],
    }),
    getScoreExport: builder.query({
      query: () => "/api/compliance/me/score-export",
    }),
    getAuditLog: builder.query({
      query: (page = 1) => ({
        url: "/api/compliance/me/audit-log",
        params: { page, limit: 10 },
      }),
    }),
    getBiasMetrics: builder.query({
      query: () => "/api/compliance/admin/bias-metrics",
      providesTags: ["Compliance"],
    }),

    /* ── Admin API keys (Phase 5) ── */
    getApiKeys: builder.query({
      query: () => "/api/admin/api-keys",
      providesTags: ["ApiKeys"],
    }),
    createApiKey: builder.mutation({
      query: (body) => ({
        url: "/api/admin/api-keys",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ApiKeys"],
    }),
    revokeApiKey: builder.mutation({
      query: (id) => ({ url: `/api/admin/api-keys/${id}`, method: "DELETE" }),
      invalidatesTags: ["ApiKeys"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetJobsQuery,
  useGetSavedJobsQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useGetCandidateDashboardQuery,
  usePreApplyCheckMutation,
  useGetRecruiterJobsQuery,
  useGetRecruiterApplicationsQuery,
  useCopilotPipelineSummaryMutation,
  useCopilotOutreachDraftMutation,
  useCopilotInterviewQuestionsMutation,
  useGetLearningCatalogQuery,
  useEnrollLearningPathMutation,
  useReleaseLearningPathMutation,
  useGetLearningPathQuery,
  useGetLearningLessonQuery,
  useCompleteLearningLessonMutation,
  useGetLearningQuizQuery,
  useSubmitLearningQuizMutation,
  useGetLearningProgressQuery,
  useMatchLearningPathsMutation,
  useGetPlansQuery,
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useOpenBillingPortalMutation,
  useGetDisclosureQuery,
  useGetScoreExportQuery,
  useLazyGetScoreExportQuery,
  useGetAuditLogQuery,
  useGetBiasMetricsQuery,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
} = apiSlice;

/* ──────────────────────────────────────────────────────────────────────────
 * Shared notifications polling — configured ONCE for the whole app.
 * Navbar, DashboardLayout and the dashboard page all read the resulting
 * unread count from the notifications slice instead of polling themselves.
 * ────────────────────────────────────────────────────────────────────────── */

const NOTIFICATIONS_POLL_MS = 30000;
const NOTIFICATIONS_ERROR_POLL_MS = 60000;

export function useNotificationsPolling(uid) {
  const selectResult = useMemo(
    () => (uid ? apiSlice.endpoints.getNotifications.select(uid) : null),
    [uid],
  );
  const hasError = useAppSelector((state) =>
    selectResult ? selectResult(state).isError : false,
  );

  return useGetNotificationsQuery(uid, {
    skip: !uid,
    refetchOnFocus: true,
    // Mirror the old hand-rolled polling: 30s cadence normally, 60s when the
    // backend is unreachable (common while developing locally).
    pollingInterval: hasError
      ? NOTIFICATIONS_ERROR_POLL_MS
      : NOTIFICATIONS_POLL_MS,
  });
}
