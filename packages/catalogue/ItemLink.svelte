<script lang="ts">
  import type { AppearanceInput } from "@mywinkel/block-sdk/appearance";
  import { createClasses } from "@mywinkel/block-sdk/appearance.svelte";
  import { namedPartDefaults as parts } from "./parts";
  let { href, appearance }: { href: string; appearance?: AppearanceInput } =
    $props();
  const cx = createClasses(() => appearance);
  let message = $state("");
  let copying = $state(false);
  async function copy() {
    if (copying) return;
    copying = true;
    try {
      await navigator.clipboard.writeText(href);
      message = "Item link copied.";
    } catch {
      message =
        "Could not copy automatically. Select the item link and copy it manually.";
    } finally {
      copying = false;
    }
  }
</script>

<div class="my-4 grid min-w-0 gap-2">
  <label class={cx("catalogue.field", parts["catalogue.field"])}>
    Item link
    <input
      class={`${cx("catalogue.control", parts["catalogue.control"])} w-full min-w-0 text-base`}
      type="url"
      value={href}
      readonly
      onfocus={(event) => event.currentTarget.select()}
    />
  </label>
  <button
    type="button"
    class={`${cx("catalogue.detail-link", parts["catalogue.detail-link"])} justify-self-start`}
    disabled={copying}
    onclick={copy}>{copying ? "Copying…" : "Copy item link"}</button
  >
  <p role="status" class={cx("catalogue.meta", parts["catalogue.meta"])}>
    {message}
  </p>
</div>
