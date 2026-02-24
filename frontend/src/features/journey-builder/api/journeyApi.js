import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const journeyApi = createApi({
  reducerPath: 'journeyApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/journey-builder' }),
  tagTypes: ['Journey', 'Template', 'Execution'],
  endpoints: (builder) => ({
    getJourneys: builder.query({
      query: () => '/journeys',
      providesTags: ['Journey'],
    }),
    createJourney: builder.mutation({
      query: (payload) => ({
        url: '/journeys',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Journey'],
    }),
    updateJourney: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/journeys/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Journey'],
    }),
    publishJourney: builder.mutation({
      query: (journeyId) => ({
        url: `/journeys/${journeyId}/publish`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Journey'],
    }),
    deleteJourney: builder.mutation({
      query: (journeyId) => ({
        url: `/journeys/${journeyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Journey'],
    }),
    getTemplates: builder.query({
      query: () => '/templates',
      providesTags: ['Template'],
    }),
    createTemplate: builder.mutation({
      query: (payload) => ({
        url: '/templates',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Template'],
    }),
    updateTemplate: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/templates/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Template'],
    }),
    deleteTemplate: builder.mutation({
      query: (id) => ({
        url: `/templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Template'],
    }),
    getSchemas: builder.query({
      query: () => '/schemas',
    }),
    getSchemaFields: builder.query({
      query: (schemaKey) => `/schemas/${schemaKey}/fields`,
    }),
    getSchemaContextFields: builder.query({
      query: (schemaKey) => `/schemas/${schemaKey}/context-fields`,
    }),
    triggerJourneyEvent: builder.mutation({
      query: (payload) => ({
        url: '/executions/trigger',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Execution'],
    }),
  }),
});

export const {
  useGetJourneysQuery,
  useCreateJourneyMutation,
  useUpdateJourneyMutation,
  useDeleteJourneyMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useGetSchemasQuery,
  useGetSchemaFieldsQuery,
  useGetSchemaContextFieldsQuery,
  useTriggerJourneyEventMutation,
  usePublishJourneyMutation,
} = journeyApi;
