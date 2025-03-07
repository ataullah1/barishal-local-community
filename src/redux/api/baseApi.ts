import {
  BaseQueryApi,
  BaseQueryFn,
  DefinitionType,
  FetchArgs,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { toast } from "sonner";
import { logout, setUser } from "../features/auth/authSlice";
import { RootState } from "../store";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  // baseUrl: "http://localhost:5000/api/v1",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("authorization", `${token}`);
    }

    return headers;
  },
  responseHandler: async (response) => {
    const text = await response.text();
    try {
      return JSON.parse(text); // Try to parse as JSON
    } catch (e) {
      return { token: text }; // Return as plain text if JSON parsing fails
    }
  },
});

const baseQueryWithRefreshToken: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  let result = (await baseQuery(args, api, extraOptions)) as any;

  if (result?.error?.status === 400) {
    toast.error(result?.error?.data?.message);
  }
  if (result?.error?.status === 404) {
    toast.error(result?.error?.data?.message);
  }
  if (result?.error?.status === 403) {
    toast.error(result?.error?.data?.message);
  }
  if (result?.error?.status === 401) {
    //* Send Refresh
    console.log("Sending refresh token");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (data?.data?.accessToken) {
      const user = (api.getState() as RootState).auth.user;

      api.dispatch(
        setUser({
          user,
          token: data.data.accessToken,
        })
      );

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithRefreshToken,
  tagTypes: ["Admin", "User", "Post", "Category"],
  endpoints: () => ({}),
});
