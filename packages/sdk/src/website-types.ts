import type { MenuItem } from "./public/website/menu";
import type { Appearance, SiteBlockDefaults } from "./appearance";
import type { Catalogue } from "./public/storefront/contracts";
export type Block =
  | {
      id: string;
      type: "classes";
      props: { termsUrl: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "content";
      props: { html: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "membership";
      props: { termsUrl: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "booking";
      props: { termsUrl: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "rich-text";
      props: { html: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "html";
      props: { html: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "image";
      props: {
        src: string;
        alt: string;
        caption: string;
        href: string;
        showCaption: boolean;
        heading: string;
        mediaId?: string | undefined;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "gallery";
      props: {
        cards: {
          id: string;
          title: string;
          text: string;
          image: string;
          alt: string;
          href: string;
          mediaId?: string | undefined;
        }[];
        columns: number;
        layout: "grid" | "list";
        showImages: boolean;
        showDescriptions: boolean;
        heading: string;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "grid";
      props: {
        cards: {
          id: string;
          title: string;
          text: string;
          image: string;
          alt: string;
          href: string;
          mediaId?: string | undefined;
        }[];
        columns: number;
        layout: "grid" | "list";
        showImages: boolean;
        showDescriptions: boolean;
        heading: string;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "view";
      props: {
        source:
          | "products"
          | "services"
          | "classes"
          | "menus"
          | "rental-offer"
          | "membership-offer";
        href: string;
        search: string;
        sort: "name" | "price" | "name-desc" | "price-desc";
        limit: number;
        contentTypeId: string;
        fields: { title: string; text: string; image: string; href: string };
        cards: {
          id: string;
          title: string;
          text: string;
          image: string;
          alt: string;
          href: string;
          mediaId?: string | undefined;
        }[];
        columns: number;
        layout: "grid" | "list";
        showImages: boolean;
        showDescriptions: boolean;
        heading: string;
        contentId?: string | undefined;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "catalogue";
      props: {
        source:
          | "products"
          | "services"
          | "classes"
          | "menus"
          | "rental-offer"
          | "membership-offer";
        href: string;
        search: string;
        sort: "name" | "price" | "name-desc" | "price-desc";
        limit: number;
        contentTypeId: string;
        fields: { title: string; text: string; image: string; href: string };
        cards: {
          id: string;
          title: string;
          text: string;
          image: string;
          alt: string;
          href: string;
          mediaId?: string | undefined;
        }[];
        columns: number;
        layout: "grid" | "list";
        showImages: boolean;
        showDescriptions: boolean;
        heading: string;
        contentId?: string | undefined;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "menu";
      props: {
        menuItems: MenuItem[];
        orientation: "horizontal" | "vertical";
        heading: string;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "section";
      props: {
        role: "section" | "header" | "footer";
        showBranding: boolean;
        heading: string;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "page-content";
      props: { heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "form";
      props: { heading: string; formId?: string | undefined };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "cart";
      props: { termsUrl: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "rental";
      props: { termsUrl: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "preorder";
      props: { termsUrl: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "enquiry";
      props: { heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "component";
      props: {
        configuration: Record<string, string | number | boolean>;
        heading: string;
        componentId?: string | undefined;
      };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "customer-account";
      props: { heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "request-status";
      props: { id: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    }
  | {
      id: string;
      type: "quote-acceptance";
      props: { quoteId: string; heading: string };
      appearance?: Appearance;
      configured?: string[];
      children?: Block[];
    };
export type PageDocument = {
  kind: "page";
  slug: string;
  templateId: string;
  layoutId: string;
  parentId: string | null;
  position: number;
  title: string;
  description: string;
  blocks: Block[];
  redirects: string[];
  schemaVersion: 2;
  id: string;
  name: string;
};
export type LayoutDocument = {
  kind: "layout";
  templateId: string;
  blocks: Block[];
  schemaVersion: 2;
  id: string;
  name: string;
};
export type AliasDocument = {
  kind: "alias";
  sourcePageId: string;
  slug: string;
  parentId: string | null;
  position: number;
  redirects: string[];
  schemaVersion: 2;
  id: string;
  name: string;
};
export type SiteDocument =
  | {
      kind: "page";
      slug: string;
      templateId: string;
      layoutId: string;
      parentId: string | null;
      position: number;
      title: string;
      description: string;
      blocks: Block[];
      redirects: string[];
      schemaVersion: 2;
      id: string;
      name: string;
    }
  | {
      kind: "layout";
      templateId: string;
      blocks: Block[];
      schemaVersion: 2;
      id: string;
      name: string;
    }
  | {
      kind: "alias";
      sourcePageId: string;
      slug: string;
      parentId: string | null;
      position: number;
      redirects: string[];
      schemaVersion: 2;
      id: string;
      name: string;
    }
  | {
      kind: "form";
      fields: {
        id: string;
        label: string;
        type:
          | "number"
          | "date"
          | "file"
          | "email"
          | "text"
          | "textarea"
          | "checkbox"
          | "select"
          | "radio"
          | "consent"
          | "tel";
        required: boolean;
        help: string;
        options: string[];
        file?:
          | {
              preset?:
                | "any"
                | "custom"
                | "images"
                | "documents"
                | "audio"
                | "video"
                | "images-and-documents"
                | undefined;
              extensions?: string[] | undefined;
              maxBytes?: number | undefined;
              maxFiles?: number | undefined;
            }
          | undefined;
      }[];
      submitLabel: string;
      successMessage: string;
      actions: {
        notifyStaff: string[];
        customer: boolean;
        enquiry: boolean;
        nameField: string;
        emailField: string;
        phoneField: string;
        messageField: string;
      };
      formLayout: "stacked" | "inline";
      floatingLabels: boolean;
      schemaVersion: 2;
      id: string;
      name: string;
    };
export type SiteEntry = {
  document: SiteDocument;
  published: SiteDocument | null;
  version: number;
  publishedVersion: number;
  updatedAt: number;
  needsPublication: boolean;
};
export type RegisteredBlock = {
  id: string;
  label: string;
  fields: {
    key: string;
    label: string;
    type: "number" | "text" | "textarea" | "checkbox" | "url";
  }[];
};
export type NavigationItem = {
  label: string;
  href: string;
  children?: NavigationItem[];
};
export type WebsiteRenderData = {
  blockDefaults?: SiteBlockDefaults;
  page: PageDocument;
  layout: LayoutDocument;
  documents: SiteDocument[];
  navigation: NavigationItem[];
  catalogue: Catalogue;
  preview?: boolean;
  editingDocumentId?: string;
  editingDocumentKind?: "page" | "layout";
};
