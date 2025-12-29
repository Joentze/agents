export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          variables?: Json
          extensions?: Json
          operationName?: string
          query?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app: {
        Row: {
          callId: string
          chatId: string
          created_at: string
          created_by: string
          files: Json
          id: string
          logs: Json
          name: string
          updated_at: string
        }
        Insert: {
          callId: string
          chatId: string
          created_at?: string
          created_by?: string
          files: Json
          id?: string
          logs: Json
          name: string
          updated_at?: string
        }
        Update: {
          callId?: string
          chatId?: string
          created_at?: string
          created_by?: string
          files?: Json
          id?: string
          logs?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_chatId_chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact: {
        Row: {
          callId: string | null
          chatId: string | null
          content: string
          created_at: string
          created_by: string
          description: string
          folderId: string | null
          id: string
          jsonContent: Json | null
          public: boolean
          title: string
          type: Database["public"]["Enums"]["artifact_type"]
          updated_at: string
        }
        Insert: {
          callId?: string | null
          chatId?: string | null
          content: string
          created_at?: string
          created_by?: string
          description: string
          folderId?: string | null
          id?: string
          jsonContent?: Json | null
          public?: boolean
          title: string
          type?: Database["public"]["Enums"]["artifact_type"]
          updated_at?: string
        }
        Update: {
          callId?: string | null
          chatId?: string | null
          content?: string
          created_at?: string
          created_by?: string
          description?: string
          folderId?: string | null
          id?: string
          jsonContent?: Json | null
          public?: boolean
          title?: string
          type?: Database["public"]["Enums"]["artifact_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_chatId_chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_folderId_artifact_folder_id_fk"
            columns: ["folderId"]
            isOneToOne: false
            referencedRelation: "artifact_folder"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_folder: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifact_folder_parent_folder_id_artifact_folder_id_fk"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "artifact_folder"
            referencedColumns: ["id"]
          },
        ]
      }
      chat: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      file: {
        Row: {
          created_at: string
          created_by: string
          id: string
          mimeType: string
          name: string
          originalMimeType: string
          size: number
          type: Database["public"]["Enums"]["file_type"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          mimeType: string
          name: string
          originalMimeType: string
          size: number
          type: Database["public"]["Enums"]["file_type"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          mimeType?: string
          name?: string
          originalMimeType?: string
          size?: number
          type?: Database["public"]["Enums"]["file_type"]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      message: {
        Row: {
          attachments: Json
          chatId: string
          created_at: string
          created_by: string
          id: string
          metadata: Json
          parts: Json
          role: string
          updated_at: string
        }
        Insert: {
          attachments: Json
          chatId: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json
          parts: Json
          role: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          chatId?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json
          parts?: Json
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_chatId_chat_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "chat"
            referencedColumns: ["id"]
          },
        ]
      }
      secret: {
        Row: {
          created_at: string
          created_by: string
          id: string
          updated_at: string
          vault_secret_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
          vault_secret_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
          vault_secret_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_secret_by_key_id: {
        Args: { p_secret_id: string }
        Returns: string
      }
      get_folder_path: {
        Args: { folder_id: string }
        Returns: {
          updated_at: string
          depth: number
          parent_folder_id: string
          name: string
          created_by: string
          id: string
          created_at: string
        }[]
      }
      get_secret_token: {
        Args: { p_secret_id: string }
        Returns: string
      }
      insert_secret_token: {
        Args: {
          p_name: string
          p_description: string
          p_secret: string
          p_secret_id: string
        }
        Returns: string
      }
      update_secret_token: {
        Args: {
          p_name?: string
          p_secret_id: string
          p_secret: string
          p_description?: string
        }
        Returns: string
      }
      upsert_secret_token: {
        Args: {
          p_secret_id: string
          p_name: string
          p_description: string
          p_secret: string
        }
        Returns: string
      }
    }
    Enums: {
      artifact_type: "default" | "code"
      file_type: "image" | "document" | "csv"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      artifact_type: ["default", "code"],
      file_type: ["image", "document", "csv"],
    },
  },
} as const

