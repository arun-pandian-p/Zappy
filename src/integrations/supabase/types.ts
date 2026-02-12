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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          clicks: number | null
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          impressions: number | null
          is_active: boolean | null
          link_url: string | null
          starts_at: string | null
          target_categories: string[] | null
          target_locations: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          link_url?: string | null
          starts_at?: string | null
          target_categories?: string[] | null
          target_locations?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          link_url?: string | null
          starts_at?: string | null
          target_categories?: string[] | null
          target_locations?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_daily: {
        Row: {
          avg_order_value: number | null
          avg_prep_time_minutes: number | null
          avg_wait_time_minutes: number | null
          created_at: string | null
          date: string
          id: string
          order_count: number | null
          restaurant_id: string
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          avg_order_value?: number | null
          avg_prep_time_minutes?: number | null
          avg_wait_time_minutes?: number | null
          created_at?: string | null
          date: string
          id?: string
          order_count?: number | null
          restaurant_id: string
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_order_value?: number | null
          avg_prep_time_minutes?: number | null
          avg_wait_time_minutes?: number | null
          created_at?: string | null
          date?: string
          id?: string
          order_count?: number | null
          restaurant_id?: string
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          restaurant_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          restaurant_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          restaurant_id: string
          starts_at: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          restaurant_id: string
          starts_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          restaurant_id?: string
          starts_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          restaurant_id: string | null
          session_id: string | null
          table_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          restaurant_id?: string | null
          session_id?: string | null
          table_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          restaurant_id?: string | null
          session_id?: string | null
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_events_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      default_tax_settings: {
        Row: {
          currency: string
          gst_percent: number
          id: string
          service_charge_percent: number
          tax_mode: string
          updated_at: string
          vat_percent: number
        }
        Insert: {
          currency?: string
          gst_percent?: number
          id?: string
          service_charge_percent?: number
          tax_mode?: string
          updated_at?: string
          vat_percent?: number
        }
        Update: {
          currency?: string
          gst_percent?: number
          id?: string
          service_charge_percent?: number
          tax_mode?: string
          updated_at?: string
          vat_percent?: number
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          id: string
          subject: string
          template_name: string
          updated_at: string
          variables_json: Json | null
        }
        Insert: {
          body_html?: string
          created_at?: string
          id?: string
          subject?: string
          template_name: string
          updated_at?: string
          variables_json?: Json | null
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          subject?: string
          template_name?: string
          updated_at?: string
          variables_json?: Json | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          order_id: string | null
          rating: number
          redirected_to_google: boolean | null
          restaurant_id: string
          table_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          order_id?: string | null
          rating: number
          redirected_to_google?: boolean | null
          restaurant_id: string
          table_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          redirected_to_google?: boolean | null
          restaurant_id?: string
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          order_id: string
          payment_method: string
          payment_status: string
          printed: boolean | null
          restaurant_id: string
          service_charge: number
          subtotal: number
          tax_amount: number
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number: string
          items: Json
          notes?: string | null
          order_id: string
          payment_method: string
          payment_status?: string
          printed?: boolean | null
          restaurant_id: string
          service_charge?: number
          subtotal?: number
          tax_amount?: number
          total_amount?: number
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          order_id?: string
          payment_method?: string
          payment_status?: string
          printed?: boolean | null
          restaurant_id?: string
          service_charge?: number
          subtotal?: number
          tax_amount?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_popular: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          prep_time_minutes: number | null
          price: number
          restaurant_id: string
          spicy_level: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_popular?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          prep_time_minutes?: number | null
          price: number
          restaurant_id: string
          spicy_level?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_popular?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          prep_time_minutes?: number | null
          price?: number
          restaurant_id?: string
          spicy_level?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string | null
          name: string
          order_id: string
          price: number
          quantity: number
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          name: string
          order_id: string
          price: number
          quantity?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string | null
          name?: string
          order_id?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_phone: string | null
          estimated_ready_at: string | null
          id: string
          order_number: number
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          ready_at: string | null
          restaurant_id: string
          service_charge: number | null
          special_instructions: string | null
          started_preparing_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          table_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_ready_at?: string | null
          id?: string
          order_number?: number
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          ready_at?: string | null
          restaurant_id: string
          service_charge?: number | null
          special_instructions?: string | null
          started_preparing_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          table_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          estimated_ready_at?: string | null
          id?: string
          order_number?: number
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          ready_at?: string | null
          restaurant_id?: string
          service_charge?: number | null
          special_instructions?: string | null
          started_preparing_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          table_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          email_logo_url: string | null
          favicon_url: string | null
          id: string
          login_bg_url: string | null
          logo_url: string | null
          platform_name: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          email_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          login_bg_url?: string | null
          logo_url?: string | null
          platform_name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          email_logo_url?: string | null
          favicon_url?: string | null
          id?: string
          login_bg_url?: string | null
          logo_url?: string | null
          platform_name?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      printer_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          order_id: string | null
          receipt_data: Json
          receipt_type: string
          restaurant_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          receipt_data: Json
          receipt_type?: string
          restaurant_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          receipt_data?: Json
          receipt_type?: string
          restaurant_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printer_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_queue_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          ads_enabled: boolean | null
          banner_image_url: string | null
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          email: string | null
          favicon_url: string | null
          font_family: string | null
          google_review_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          menu_title: string | null
          name: string
          phone: string | null
          primary_color: string | null
          printer_settings: Json | null
          review_settings: Json | null
          secondary_color: string | null
          service_charge_rate: number | null
          settings: Json | null
          slug: string
          subscription_ends_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          ads_enabled?: boolean | null
          banner_image_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          favicon_url?: string | null
          font_family?: string | null
          google_review_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          menu_title?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          printer_settings?: Json | null
          review_settings?: Json | null
          secondary_color?: string | null
          service_charge_rate?: number | null
          settings?: Json | null
          slug: string
          subscription_ends_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          ads_enabled?: boolean | null
          banner_image_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          favicon_url?: string | null
          font_family?: string | null
          google_review_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          menu_title?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          printer_settings?: Json | null
          review_settings?: Json | null
          secondary_color?: string | null
          service_charge_rate?: number | null
          settings?: Json | null
          slug?: string
          subscription_ends_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_orders_per_month: number | null
          max_tables: number | null
          name: string
          price_monthly: number
          price_yearly: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_orders_per_month?: number | null
          max_tables?: number | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_orders_per_month?: number | null
          max_tables?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      table_sessions: {
        Row: {
          billing_at: string | null
          completed_at: string | null
          created_at: string | null
          food_ready_at: string | null
          id: string
          order_id: string | null
          order_placed_at: string | null
          restaurant_id: string
          seated_at: string | null
          served_at: string | null
          status: string | null
          table_id: string
        }
        Insert: {
          billing_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          food_ready_at?: string | null
          id?: string
          order_id?: string | null
          order_placed_at?: string | null
          restaurant_id: string
          seated_at?: string | null
          served_at?: string | null
          status?: string | null
          table_id: string
        }
        Update: {
          billing_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          food_ready_at?: string | null
          id?: string
          order_id?: string | null
          order_placed_at?: string | null
          restaurant_id?: string
          seated_at?: string | null
          served_at?: string | null
          status?: string | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          qr_code_url: string | null
          restaurant_id: string
          status: string | null
          table_number: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_url?: string | null
          restaurant_id: string
          status?: string | null
          table_number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_url?: string | null
          restaurant_id?: string
          status?: string | null
          table_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          restaurant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          restaurant_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_calls: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          responded_at: string | null
          responded_by: string | null
          restaurant_id: string
          status: string | null
          table_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          responded_at?: string | null
          responded_by?: string | null
          restaurant_id: string
          status?: string | null
          table_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          responded_at?: string | null
          responded_by?: string | null
          restaurant_id?: string
          status?: string | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiter_calls_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_calls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_restaurant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "restaurant_admin"
        | "kitchen_staff"
        | "waiter_staff"
        | "billing_staff"
        | "manager"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "served"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "paid" | "refunded"
      subscription_tier: "free" | "pro" | "enterprise"
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
      app_role: [
        "super_admin",
        "restaurant_admin",
        "kitchen_staff",
        "waiter_staff",
        "billing_staff",
        "manager",
      ],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "served",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "refunded"],
      subscription_tier: ["free", "pro", "enterprise"],
    },
  },
} as const
