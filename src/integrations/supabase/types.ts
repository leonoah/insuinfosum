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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_about_content: {
        Row: {
          clients_title_en: string | null
          clients_title_he: string | null
          created_at: string
          id: string
          is_active: boolean | null
          project_id: string | null
          story_paragraph1_en: string | null
          story_paragraph1_he: string | null
          story_paragraph2_en: string | null
          story_paragraph2_he: string | null
          subtitle_en: string | null
          subtitle_he: string | null
          title_en: string | null
          title_he: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          clients_title_en?: string | null
          clients_title_he?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          story_paragraph1_en?: string | null
          story_paragraph1_he?: string | null
          story_paragraph2_en?: string | null
          story_paragraph2_he?: string | null
          subtitle_en?: string | null
          subtitle_he?: string | null
          title_en?: string | null
          title_he?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          clients_title_en?: string | null
          clients_title_he?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          story_paragraph1_en?: string | null
          story_paragraph1_he?: string | null
          story_paragraph2_en?: string | null
          story_paragraph2_he?: string | null
          subtitle_en?: string | null
          subtitle_he?: string | null
          title_en?: string | null
          title_he?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      admin_about_features: {
        Row: {
          created_at: string
          description_en: string
          description_he: string
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          title_en: string
          title_he: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en: string
          description_he: string
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          title_en: string
          title_he: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string
          description_he?: string
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          title_en?: string
          title_he?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_client_logos: {
        Row: {
          client_name: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_menu_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: string
          project_id: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: string
          project_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: string
          project_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_menu_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      admin_projects: {
        Row: {
          category: string | null
          client_name: string | null
          completion_date: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          project_id: string | null
          project_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          client_name?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          project_id?: string | null
          project_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          client_name?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          project_id?: string | null
          project_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_service: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          duration: string | null
          features: Json | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean
          is_visible: boolean
          price: string | null
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          duration?: string | null
          features?: Json | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          is_visible?: boolean
          price?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          duration?: string | null
          features?: Json | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          is_visible?: boolean
          price?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_service_batel: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          duration: string | null
          features: Json | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean
          is_visible: boolean
          price: string | null
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          duration?: string | null
          features?: Json | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          is_visible?: boolean
          price?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          duration?: string | null
          features?: Json | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean
          is_visible?: boolean
          price?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_testimonials: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          project_id: string | null
          rating: number | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          project_id?: string | null
          rating?: number | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          rating?: number | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_testimonials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      admin_testimonials_batel: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          project_id: string | null
          rating: number | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          project_id?: string | null
          rating?: number | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          rating?: number | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_testimonials_batel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      admin_testimonials_inbal: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          project_id: string | null
          rating: number | null
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          project_id?: string | null
          rating?: number | null
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          project_id?: string | null
          rating?: number | null
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_testimonials_inbal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      agent_info: {
        Row: {
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          category: string
          category_en: string | null
          content: string
          content_en: string | null
          created_at: string
          display_order: number | null
          excerpt: string
          excerpt_en: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          project_id: string | null
          title: string
          title_en: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          category_en?: string | null
          content: string
          content_en?: string | null
          created_at?: string
          display_order?: number | null
          excerpt: string
          excerpt_en?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          project_id?: string | null
          title: string
          title_en?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          category_en?: string | null
          content?: string
          content_en?: string | null
          created_at?: string
          display_order?: number | null
          excerpt?: string
          excerpt_en?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          project_id?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          client_email: string | null
          client_id: string
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_id: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_id?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          project_id: string | null
          section_name: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          section_name: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_id?: string | null
          section_name?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      font_settings: {
        Row: {
          created_at: string
          english_body_font: string | null
          english_heading_font: string | null
          hebrew_body_font: string | null
          hebrew_heading_font: string | null
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          english_body_font?: string | null
          english_heading_font?: string | null
          hebrew_body_font?: string | null
          hebrew_heading_font?: string | null
          id?: string
          project_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          english_body_font?: string | null
          english_heading_font?: string | null
          hebrew_body_font?: string | null
          hebrew_heading_font?: string | null
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      galleries: {
        Row: {
          category: string | null
          cloudinary_folder_name: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cloudinary_folder_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cloudinary_folder_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "galleries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number | null
          gallery_id: string | null
          id: string
          image_url: string
          is_active: boolean | null
          is_favorite: boolean | null
          is_featured_on_homepage: boolean | null
          media_type: string | null
          project_id: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          gallery_id?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          is_featured_on_homepage?: boolean | null
          media_type?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          gallery_id?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          is_favorite?: boolean | null
          is_featured_on_homepage?: boolean | null
          media_type?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      hero_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          project_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          project_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          project_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      home_gallery_inbal: {
        Row: {
          created_at: string
          id: string
          project_id: string
          selected_images: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string
          selected_images?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          selected_images?: Json
          updated_at?: string
        }
        Relationships: []
      }
      home_gallery_selections: {
        Row: {
          created_at: string
          id: string
          project_id: string
          selected_images: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string
          selected_images?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          selected_images?: Json
          updated_at?: string
        }
        Relationships: []
      }
      homepage_content: {
        Row: {
          about_text_en: string | null
          about_text_he: string | null
          cta_button1_text_en: string | null
          cta_button1_text_he: string | null
          cta_button2_text_en: string | null
          cta_button2_text_he: string | null
          cta_text_en: string | null
          cta_text_he: string | null
          cta_title_en: string | null
          cta_title_he: string | null
          hero_badge_text_en: string | null
          hero_badge_text_he: string | null
          hero_button1_text_en: string | null
          hero_button1_text_he: string | null
          hero_button2_text_en: string | null
          hero_button2_text_he: string | null
          hero_stat1_number: string | null
          hero_stat1_text_en: string | null
          hero_stat1_text_he: string | null
          hero_stat2_number: string | null
          hero_stat2_text_en: string | null
          hero_stat2_text_he: string | null
          hero_stat3_number: string | null
          hero_stat3_text_en: string | null
          hero_stat3_text_he: string | null
          hero_subtitle_en: string | null
          hero_subtitle_he: string | null
          hero_text_en: string | null
          hero_text_he: string | null
          hero_title_en: string | null
          hero_title_he: string | null
          id: string
          project_id: string | null
          socials: Json | null
          updated_at: string | null
        }
        Insert: {
          about_text_en?: string | null
          about_text_he?: string | null
          cta_button1_text_en?: string | null
          cta_button1_text_he?: string | null
          cta_button2_text_en?: string | null
          cta_button2_text_he?: string | null
          cta_text_en?: string | null
          cta_text_he?: string | null
          cta_title_en?: string | null
          cta_title_he?: string | null
          hero_badge_text_en?: string | null
          hero_badge_text_he?: string | null
          hero_button1_text_en?: string | null
          hero_button1_text_he?: string | null
          hero_button2_text_en?: string | null
          hero_button2_text_he?: string | null
          hero_stat1_number?: string | null
          hero_stat1_text_en?: string | null
          hero_stat1_text_he?: string | null
          hero_stat2_number?: string | null
          hero_stat2_text_en?: string | null
          hero_stat2_text_he?: string | null
          hero_stat3_number?: string | null
          hero_stat3_text_en?: string | null
          hero_stat3_text_he?: string | null
          hero_subtitle_en?: string | null
          hero_subtitle_he?: string | null
          hero_text_en?: string | null
          hero_text_he?: string | null
          hero_title_en?: string | null
          hero_title_he?: string | null
          id?: string
          project_id?: string | null
          socials?: Json | null
          updated_at?: string | null
        }
        Update: {
          about_text_en?: string | null
          about_text_he?: string | null
          cta_button1_text_en?: string | null
          cta_button1_text_he?: string | null
          cta_button2_text_en?: string | null
          cta_button2_text_he?: string | null
          cta_text_en?: string | null
          cta_text_he?: string | null
          cta_title_en?: string | null
          cta_title_he?: string | null
          hero_badge_text_en?: string | null
          hero_badge_text_he?: string | null
          hero_button1_text_en?: string | null
          hero_button1_text_he?: string | null
          hero_button2_text_en?: string | null
          hero_button2_text_he?: string | null
          hero_stat1_number?: string | null
          hero_stat1_text_en?: string | null
          hero_stat1_text_he?: string | null
          hero_stat2_number?: string | null
          hero_stat2_text_en?: string | null
          hero_stat2_text_he?: string | null
          hero_stat3_number?: string | null
          hero_stat3_text_en?: string | null
          hero_stat3_text_he?: string | null
          hero_subtitle_en?: string | null
          hero_subtitle_he?: string | null
          hero_text_en?: string | null
          hero_text_he?: string | null
          hero_title_en?: string | null
          hero_title_he?: string | null
          id?: string
          project_id?: string | null
          socials?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      homepage_content_batel: {
        Row: {
          about_text_en: string | null
          about_text_he: string | null
          cta_button1_text_en: string | null
          cta_button1_text_he: string | null
          cta_button2_text_en: string | null
          cta_button2_text_he: string | null
          cta_text_en: string | null
          cta_text_he: string | null
          cta_title_en: string | null
          cta_title_he: string | null
          hero_badge_text_en: string | null
          hero_badge_text_he: string | null
          hero_button1_text_en: string | null
          hero_button1_text_he: string | null
          hero_button2_text_en: string | null
          hero_button2_text_he: string | null
          hero_stat1_number: string | null
          hero_stat1_text_en: string | null
          hero_stat1_text_he: string | null
          hero_stat2_number: string | null
          hero_stat2_text_en: string | null
          hero_stat2_text_he: string | null
          hero_stat3_number: string | null
          hero_stat3_text_en: string | null
          hero_stat3_text_he: string | null
          hero_subtitle_en: string | null
          hero_subtitle_he: string | null
          hero_text_en: string | null
          hero_text_he: string | null
          hero_title_en: string | null
          hero_title_he: string | null
          id: string
          project_id: string | null
          socials: Json | null
          updated_at: string | null
        }
        Insert: {
          about_text_en?: string | null
          about_text_he?: string | null
          cta_button1_text_en?: string | null
          cta_button1_text_he?: string | null
          cta_button2_text_en?: string | null
          cta_button2_text_he?: string | null
          cta_text_en?: string | null
          cta_text_he?: string | null
          cta_title_en?: string | null
          cta_title_he?: string | null
          hero_badge_text_en?: string | null
          hero_badge_text_he?: string | null
          hero_button1_text_en?: string | null
          hero_button1_text_he?: string | null
          hero_button2_text_en?: string | null
          hero_button2_text_he?: string | null
          hero_stat1_number?: string | null
          hero_stat1_text_en?: string | null
          hero_stat1_text_he?: string | null
          hero_stat2_number?: string | null
          hero_stat2_text_en?: string | null
          hero_stat2_text_he?: string | null
          hero_stat3_number?: string | null
          hero_stat3_text_en?: string | null
          hero_stat3_text_he?: string | null
          hero_subtitle_en?: string | null
          hero_subtitle_he?: string | null
          hero_text_en?: string | null
          hero_text_he?: string | null
          hero_title_en?: string | null
          hero_title_he?: string | null
          id?: string
          project_id?: string | null
          socials?: Json | null
          updated_at?: string | null
        }
        Update: {
          about_text_en?: string | null
          about_text_he?: string | null
          cta_button1_text_en?: string | null
          cta_button1_text_he?: string | null
          cta_button2_text_en?: string | null
          cta_button2_text_he?: string | null
          cta_text_en?: string | null
          cta_text_he?: string | null
          cta_title_en?: string | null
          cta_title_he?: string | null
          hero_badge_text_en?: string | null
          hero_badge_text_he?: string | null
          hero_button1_text_en?: string | null
          hero_button1_text_he?: string | null
          hero_button2_text_en?: string | null
          hero_button2_text_he?: string | null
          hero_stat1_number?: string | null
          hero_stat1_text_en?: string | null
          hero_stat1_text_he?: string | null
          hero_stat2_number?: string | null
          hero_stat2_text_en?: string | null
          hero_stat2_text_he?: string | null
          hero_stat3_number?: string | null
          hero_stat3_text_en?: string | null
          hero_stat3_text_he?: string | null
          hero_subtitle_en?: string | null
          hero_subtitle_he?: string | null
          hero_text_en?: string | null
          hero_text_he?: string | null
          hero_title_en?: string | null
          hero_title_he?: string | null
          id?: string
          project_id?: string | null
          socials?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          message: string
          photo_id: string
          recipient_id: string
          sender_email: string
          sender_name: string
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          photo_id: string
          recipient_id: string
          sender_email: string
          sender_name: string
          subject: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          photo_id?: string
          recipient_id?: string
          sender_email?: string
          sender_name?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          photographer_id: string
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          photographer_id: string
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          photographer_id?: string
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_photographer_id_fkey"
            columns: ["photographer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_content: {
        Row: {
          category: string | null
          created_at: string | null
          date: string | null
          description: string | null
          details: string | null
          featured: boolean | null
          features: Json | null
          id: string
          image: string | null
          images: Json | null
          location: string | null
          title: string | null
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          details?: string | null
          featured?: boolean | null
          features?: Json | null
          id?: string
          image?: string | null
          images?: Json | null
          location?: string | null
          title?: string | null
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          details?: string | null
          featured?: boolean | null
          features?: Json | null
          id?: string
          image?: string | null
          images?: Json | null
          location?: string | null
          title?: string | null
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          project_id: string
          project_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          project_id: string
          project_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          project_id?: string
          project_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports_log: {
        Row: {
          client_id: string
          client_name: string
          created_at: string
          generated_at: string
          id: string
          report_content: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          created_at?: string
          generated_at?: string
          id?: string
          report_content?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          created_at?: string
          generated_at?: string
          id?: string
          report_content?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          display_order: number | null
          duration: string | null
          features: Json | null
          icon_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          price: string | null
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number | null
          duration?: string | null
          features?: Json | null
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: string | null
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number | null
          duration?: string | null
          features?: Json | null
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: string | null
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      services_inbal: {
        Row: {
          created_at: string
          description_en: string | null
          description_he: string | null
          display_order: number | null
          features: Json | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          price_en: string | null
          price_he: string | null
          project_id: string | null
          title_en: string | null
          title_he: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          display_order?: number | null
          features?: Json | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          price_en?: string | null
          price_he?: string | null
          project_id?: string | null
          title_en?: string | null
          title_he?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          display_order?: number | null
          features?: Json | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          price_en?: string | null
          price_he?: string | null
          project_id?: string | null
          title_en?: string | null
          title_he?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_backups: {
        Row: {
          backup_name: string
          created_at: string
          created_by: string | null
          file_path: string
          file_size: number | null
          id: string
          project_id: string | null
        }
        Insert: {
          backup_name: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
        }
        Update: {
          backup_name?: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
        }
        Relationships: []
      }
      site_backups_batel: {
        Row: {
          backup_name: string
          created_at: string
          created_by: string | null
          file_path: string
          file_size: number | null
          id: string
          project_id: string | null
        }
        Insert: {
          backup_name: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
        }
        Update: {
          backup_name?: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
        }
        Relationships: []
      }
      site_backups_inbal: {
        Row: {
          backup_name: string
          created_at: string
          created_by: string | null
          file_path: string
          file_size: number | null
          id: string
          project_id: string | null
        }
        Insert: {
          backup_name: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
        }
        Update: {
          backup_name?: string
          created_at?: string
          created_by?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          project_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          project_id: string | null
          section_name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      site_content_batel: {
        Row: {
          content: Json
          created_at: string
          id: string
          project_id: string | null
          section_name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_batel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      site_content_gal: {
        Row: {
          content: Json
          created_at: string
          id: string
          project_id: string | null
          section_name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_gal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      site_content_inbal: {
        Row: {
          content: Json
          created_at: string
          id: string
          project_id: string | null
          section_name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_duplicate_inbal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      site_content_vered: {
        Row: {
          content: Json
          created_at: string
          id: string
          project_id: string | null
          section_name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          project_id?: string | null
          section_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_vered_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          project_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          project_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      social_links_batel: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          project_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          project_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_batel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      social_links_gal: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          project_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          project_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_gal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      social_links_inbal: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          project_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          project_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_duplicate_inbal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      social_links_vered: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          platform: string
          project_id: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform: string
          project_id?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          project_id?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_vered_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      theme_settings: {
        Row: {
          background_color: string
          button_color: string
          created_at: string
          id: string
          project_id: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      theme_settings_batel: {
        Row: {
          background_color: string
          button_color: string
          created_at: string
          id: string
          project_id: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_batel_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      theme_settings_gal: {
        Row: {
          background_color: string
          button_color: string
          created_at: string
          id: string
          major_color: string
          project_id: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          major_color?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          major_color?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_gal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      theme_settings_Inbal: {
        Row: {
          background_color: string
          button_color: string
          created_at: string
          id: string
          project_id: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_Inbal_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      theme_settings_vered: {
        Row: {
          background_color: string
          button_color: string
          created_at: string
          id: string
          project_id: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          button_color?: string
          created_at?: string
          id?: string
          project_id?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_vered_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string
          english: string
          hebrew: string
          id: string
          project_id: string
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          english: string
          hebrew: string
          id?: string
          project_id?: string
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          english?: string
          hebrew?: string
          id?: string
          project_id?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations_batel: {
        Row: {
          created_at: string
          english: string
          hebrew: string
          id: string
          project_id: string
          section_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          english: string
          hebrew: string
          id?: string
          project_id?: string
          section_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          english?: string
          hebrew?: string
          id?: string
          project_id?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_site_content: {
        Args: { content_input: Json }
        Returns: boolean
      }
      validate_social_link_url: {
        Args: { url_input: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
