import type { Category, Cuisine } from "@/lib/recipes";

type RecipeRow = {
  id: string;
  author_name: string;
  title: string;
  cuisine: Cuisine;
  category: Category;
  ingredients: string[];
  steps: string[];
  prep_time_minutes: number;
  image_url: string;
  created_at: string;
};

type RatingRow = {
  id: string;
  recipe_id: string;
  rating: number;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      recipes: Table<
        RecipeRow,
        Omit<RecipeRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        },
        Partial<RecipeRow>
      >;
      ratings: Table<
        RatingRow,
        Omit<RatingRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        },
        Partial<RatingRow>
      >;
    };
    Views: {
      recipe_rating_summaries: {
        Row: {
          recipe_id: string;
          average_rating: number;
          rating_count: number;
        };
        Relationships: [];
      };
    };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
