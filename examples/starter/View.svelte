<script lang="ts">
  import { createClasses } from "@mywinkel/block-sdk/appearance.svelte";
  import type { BlockViewProps } from "@mywinkel/block-sdk/contract";

  let { block, appearance }: BlockViewProps = $props();
  const cx = createClasses(() => appearance);
  const content = $derived(
    block.props as { heading: string; body: string },
  );
</script>

<article class={cx("starter.root", "rounded-xl border p-6")}>
  <h2 class={cx("starter.heading", "text-xl font-semibold")}>
    {content.heading}
  </h2>
  <p class={cx("starter.body", "mt-2 leading-7")}>{content.body}</p>
</article>
