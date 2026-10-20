interface SavedStyle { value: string; priority: string }
interface ScrollLock {
    owners: Set<symbol>;
    root: HTMLElement;
    overflow: SavedStyle;
    gutter: SavedStyle;
    changedGutter: boolean;
}
const locks = new WeakMap<Document, ScrollLock>();
const saved = (style: CSSStyleDeclaration, name: string): SavedStyle => ({
    value: style.getPropertyValue(name), priority: style.getPropertyPriority(name),
});
function restore(style: CSSStyleDeclaration, name: string, previous: SavedStyle) {
    if (previous.value) style.setProperty(name, previous.value, previous.priority);
    else style.removeProperty(name);
}
/** 本台弹层持有临时滚动锁；最后一个持有者退出才恢复，不改共享滚动外观。 */
export function lockDialogScroll(doc: Document): () => void {
    let lock = locks.get(doc);
    if (!lock) {
        const root = doc.documentElement;
        const view = doc.defaultView;
        const changedGutter = !!view && view.innerWidth > root.clientWidth
            && !view.getComputedStyle(root).getPropertyValue("scrollbar-gutter").includes("stable");
        lock = { owners: new Set(), root, overflow: saved(root.style, "overflow-y"),
            gutter: saved(root.style, "scrollbar-gutter"), changedGutter };
        if (changedGutter) root.style.setProperty("scrollbar-gutter", "stable", "important");
        root.style.setProperty("overflow-y", "hidden", "important");
        locks.set(doc, lock);
    }
    const owner = Symbol("树洞弹层滚动锁");
    lock.owners.add(owner);
    const selected = lock;
    return () => {
        if (!selected.owners.delete(owner) || selected.owners.size) return;
        const style = selected.root.style;
        // 外部调用者若已改成其他值，不能以旧快照覆盖它。
        if (style.getPropertyValue("overflow-y") === "hidden" && style.getPropertyPriority("overflow-y") === "important")
            restore(style, "overflow-y", selected.overflow);
        if (selected.changedGutter && style.getPropertyValue("scrollbar-gutter") === "stable" && style.getPropertyPriority("scrollbar-gutter") === "important")
            restore(style, "scrollbar-gutter", selected.gutter);
        locks.delete(doc);
    };
}
