/**
 * Database types for the `public` schema, in the shape `supabase gen types
 * typescript` produces. Hand-maintained to match supabase/setup.sql.
 *
 * Regenerate against the live project (recommended once the CLI is available),
 * which will overwrite this file:
 *
 *   npx supabase login
 *   npx supabase gen types typescript \
 *     --project-id <project-ref> --schema public > src/types/supabase.ts
 *
 * The browser/server Supabase clients are parameterised with `Database`, so
 * table names, column names, insert payloads, and embedded selects are all
 * type-checked against this definition.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  // Supabase (hosted) ships PostgREST 12. supabase-js reads this to gate
  // version-specific query features; gen types emits it automatically.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      clients: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_client_roles: {
        Row: { user_id: string; client_id: string; role: string; created_at: string };
        Insert: {
          user_id: string;
          client_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          client_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_client_roles_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      investees: {
        Row: {
          id: string;
          user_id: string;
          client_id: string;
          company_name: string;
          contact_person: string | null;
          contact_email: string | null;
          country: string | null;
          industry: string | null;
          status: string;
          metadata: Json;
          onboarded_at: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id: string;
          company_name: string;
          contact_person?: string | null;
          contact_email?: string | null;
          country?: string | null;
          industry?: string | null;
          status?: string;
          metadata?: Json;
          onboarded_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string;
          company_name?: string;
          contact_person?: string | null;
          contact_email?: string | null;
          country?: string | null;
          industry?: string | null;
          status?: string;
          metadata?: Json;
          onboarded_at?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "investees_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_statuses: {
        Row: { id: string; slug: string; label: string; sort_order: number };
        Insert: { id?: string; slug: string; label: string; sort_order?: number };
        Update: { id?: string; slug?: string; label?: string; sort_order?: number };
        Relationships: [];
      };
      submission_requests: {
        Row: {
          id: string;
          client_id: string;
          investee_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          status_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          investee_id: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          investee_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submission_requests_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "workflow_statuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submission_requests_investee_id_fkey";
            columns: ["investee_id"];
            isOneToOne: false;
            referencedRelation: "investees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submission_requests_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          submission_request_id: string;
          client_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          content_type: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_request_id: string;
          client_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          content_type?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_request_id?: string;
          client_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number;
          content_type?: string | null;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_submission_request_id_fkey";
            columns: ["submission_request_id"];
            isOneToOne: false;
            referencedRelation: "submission_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      comment_visibility_types: {
        Row: { id: string; slug: string; label: string };
        Insert: { id?: string; slug: string; label: string };
        Update: { id?: string; slug?: string; label?: string };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          submission_request_id: string;
          author_id: string;
          body: string;
          visibility_type_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_request_id: string;
          author_id: string;
          body: string;
          visibility_type_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_request_id?: string;
          author_id?: string;
          body?: string;
          visibility_type_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_submission_request_id_fkey";
            columns: ["submission_request_id"];
            isOneToOne: false;
            referencedRelation: "submission_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            // View relationship so `author:comment_author(...)` embeds resolve.
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "comment_author";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_visibility_type_id_fkey";
            columns: ["visibility_type_id"];
            isOneToOne: false;
            referencedRelation: "comment_visibility_types";
            referencedColumns: ["id"];
          },
        ];
      };
      submission_status_history: {
        Row: {
          id: string;
          submission_request_id: string;
          status_id: string;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          submission_request_id: string;
          status_id: string;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          submission_request_id?: string;
          status_id?: string;
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submission_status_history_submission_request_id_fkey";
            columns: ["submission_request_id"];
            isOneToOne: false;
            referencedRelation: "submission_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submission_status_history_status_id_fkey";
            columns: ["status_id"];
            isOneToOne: false;
            referencedRelation: "workflow_statuses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      comment_author: {
        Row: {
          id: string | null;
          display_name: string | null;
          role: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      current_investee_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      is_client_admin: {
        Args: { p_client_id: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
