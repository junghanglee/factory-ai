export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          room_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          room_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_profiles: {
        Row: {
          active: boolean
          created_at: string
          department: string | null
          id: string
          menu_permissions: string[]
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string | null
          id?: string
          menu_permissions?: string[]
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string | null
          id?: string
          menu_permissions?: string[]
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      auto_messages: {
        Row: {
          active: boolean
          created_at: string
          id: string
          message: string
          sort_order: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          message: string
          sort_order?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          message?: string
          sort_order?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon_name: string
          id: string
          name: string
          service_count: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          name: string
          service_count?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon_name?: string
          id?: string
          name?: string
          service_count?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_read: boolean
          message: string | null
          message_type: string
          room_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          message_type?: string
          room_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          message_type?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          admin_id: string | null
          created_at: string
          customer_id: string
          id: string
          last_message: string | null
          last_message_at: string | null
          metadata: Json | null
          project_id: string | null
          service_id: string | null
          status: string
          title: string
          unread_admin: number
          unread_customer: number
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          project_id?: string | null
          service_id?: string | null
          status?: string
          title?: string
          unread_admin?: number
          unread_customer?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          metadata?: Json | null
          project_id?: string | null
          service_id?: string | null
          status?: string
          title?: string
          unread_admin?: number
          unread_customer?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_inquiries: {
        Row: {
          admin_memo: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          inquiry_type: string
          message: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_memo?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          inquiry_type?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_memo?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          inquiry_type?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_requests: {
        Row: {
          created_at: string
          id: string
          message_id: string
          request_text: string
          responded_at: string | null
          response_text: string | null
          room_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          request_text: string
          responded_at?: string | null
          response_text?: string | null
          room_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          request_text?: string
          responded_at?: string | null
          response_text?: string | null
          room_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_requests_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          assigned_admin_id: string | null
          created_at: string
          email: string
          id: string
          name: string
          order_count: number
          phone: string | null
          status: string
          total_spent: number
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          order_count?: number
          phone?: string | null
          status?: string
          total_spent?: number
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          order_count?: number
          phone?: string | null
          status?: string
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          active: boolean
          category: string | null
          client_name: string | null
          cost: string | null
          created_at: string
          description: string | null
          duration: string | null
          files: string[] | null
          id: string
          image_url: string | null
          show_extra_info: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          client_name?: string | null
          cost?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          files?: string[] | null
          id?: string
          image_url?: string | null
          show_extra_info?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          client_name?: string | null
          cost?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          files?: string[] | null
          id?: string
          image_url?: string | null
          show_extra_info?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          id: string
          name: string
          project_id: string
          uploaded_at: string
          url: string
        }
        Insert: {
          id?: string
          name: string
          project_id: string
          uploaded_at?: string
          url: string
        }
        Update: {
          id?: string
          name?: string
          project_id?: string
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          completed_date: string | null
          confirm_status: string
          created_at: string
          customer: string
          customer_id: string | null
          due_date: string
          id: string
          notes: string | null
          order_date: string
          order_number: string
          package_name: string | null
          price: number
          service_title: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          confirm_status?: string
          created_at?: string
          customer: string
          customer_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          package_name?: string | null
          price?: number
          service_title: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          confirm_status?: string
          created_at?: string
          customer?: string
          customer_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          package_name?: string | null
          price?: number
          service_title?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_phrases: {
        Row: {
          created_at: string
          id: string
          phrase: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          phrase: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          phrase?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          created_at: string
          delivery_days: number
          features: string[] | null
          id: string
          name: string
          price: number
          revisions: number
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          delivery_days?: number
          features?: string[] | null
          id?: string
          name: string
          price?: number
          revisions?: number
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          delivery_days?: number
          features?: string[] | null
          id?: string
          name?: string
          price?: number
          revisions?: number
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          delivery_days: number
          description: string | null
          detailed_description: string | null
          id: string
          original_price: number
          portfolio_images: string[] | null
          price: number
          rating: number
          review_count: number
          seller: string | null
          tags: string[] | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          delivery_days?: number
          description?: string | null
          detailed_description?: string | null
          id?: string
          original_price?: number
          portfolio_images?: string[] | null
          price?: number
          rating?: number
          review_count?: number
          seller?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          delivery_days?: number
          description?: string | null
          detailed_description?: string | null
          id?: string
          original_price?: number
          portfolio_images?: string[] | null
          price?: number
          rating?: number
          review_count?: number
          seller?: string | null
          tags?: string[] | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          review_id: string
          timestamp_seconds: number
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          review_id: string
          timestamp_seconds?: number
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          review_id?: string
          timestamp_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "video_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      video_reviews: {
        Row: {
          created_at: string
          id: string
          message_id: string
          project_id: string | null
          room_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          project_id?: string | null
          room_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          project_id?: string | null
          room_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "super_admin"],
    },
  },
} as const
