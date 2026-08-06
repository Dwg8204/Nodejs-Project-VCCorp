import { DOCUMENT } from '@angular/common';
import { inject, Injectable, NgZone } from '@angular/core';

type EnhancedSelect = HTMLSelectElement & { _uiSelectWrapper?: HTMLElement };

@Injectable({ providedIn: 'root' })
export class UiSelectService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private active: HTMLElement | null = null;
  private observer?: MutationObserver;
  private stableSyncStarted = false;

  start(): void {
    if (this.observer || !this.document.defaultView) return;
    this.zone.runOutsideAngular(() => {
      queueMicrotask(() => this.enhanceTree(this.document));
      this.observer = new MutationObserver((records) => {
        for (const record of records) {
          record.addedNodes.forEach((node) => {
            if (node instanceof Element) this.enhanceTree(node);
          });
          const mutationElement =
            record.target instanceof Element
              ? record.target
              : record.target.parentElement;
          const select = mutationElement?.closest(
            'select',
          ) as EnhancedSelect | null;
          if (select?._uiSelectWrapper) this.refresh(select);
        }
      });
      this.observer.observe(this.document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['data-ui-value'],
      });
      this.document.addEventListener('click', (event) => {
        const target = event.target as Element;
        if (this.active && !target.closest('.ui-select-menu') && !target.closest('.ui-select')) this.close();
      });
      this.document.addEventListener('change', (event) => {
        const select = event.target as EnhancedSelect;
        if (select?.matches?.('select') && select._uiSelectWrapper) this.refresh(select);
      });
      this.document.addEventListener('keydown', (event) => { if (event.key === 'Escape') this.close(true); });
      this.document.defaultView!.addEventListener('resize', () => this.close());
      this.document.defaultView!.addEventListener('scroll', (event) => {
        if (!this.active) return;
        const menu = (this.active as any)._menu as HTMLElement | undefined;
        const target = event.target;
        // Scrolling the option list itself must not close the dropdown. Only a
        // scroll coming from the page or another scroll container closes it.
        if (menu && target instanceof Node && (target === menu || menu.contains(target))) return;
        this.close();
      }, true);
    });
    // Angular may write a select's value property after its options have been
    // inserted. Property writes do not produce DOM mutations, so refresh every
    // enhanced trigger once the current Angular render has settled.
    if (!this.stableSyncStarted) {
      this.stableSyncStarted = true;
      this.zone.onStable.subscribe(() => this.refreshTree());
    }
  }

  private enhanceTree(root: ParentNode): void {
    if (root instanceof HTMLSelectElement) this.enhance(root as EnhancedSelect);
    root.querySelectorAll?.('select').forEach((select) => this.enhance(select as EnhancedSelect));
  }

  private enhance(select: EnhancedSelect): void {
    if (select._uiSelectWrapper || select.multiple || select.size > 1 || select.dataset['uiSelect'] === 'off' || select.closest('.dashboard-period-control')) return;
    const wrapper = this.document.createElement('div');
    wrapper.className = 'ui-select';
    if (select.style.maxWidth) wrapper.style.maxWidth = select.style.maxWidth;
    const trigger = this.document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'ui-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.innerHTML = '<span class="ui-select-label"></span><iconify-icon icon="solar:alt-arrow-down-linear"></iconify-icon>';
    const menu = this.document.createElement('div');
    menu.className = 'ui-select-menu';
    menu.setAttribute('role', 'listbox');
    select.before(wrapper);
    wrapper.append(select, trigger);
    this.document.body.append(menu);
    select._uiSelectWrapper = wrapper;
    (wrapper as any)._nativeSelect = select;
    (wrapper as any)._menu = menu;
    select.tabIndex = -1;
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      this.active === wrapper ? this.close() : this.open(wrapper);
    });
    select.addEventListener('focus', () => trigger.focus());
    this.refresh(select);
    this.document.defaultView?.requestAnimationFrame(() => this.refresh(select));
  }

  private refreshTree(): void {
    this.document.querySelectorAll<EnhancedSelect>('select').forEach((select) => {
      if (select._uiSelectWrapper) this.refresh(select);
    });
  }

  private refresh(select: EnhancedSelect): void {
    const wrapper = select._uiSelectWrapper;
    if (!wrapper) return;
    const trigger = wrapper.querySelector<HTMLButtonElement>('.ui-select-trigger')!;
    const label = trigger.querySelector<HTMLElement>('.ui-select-label')!;
    const menu = (wrapper as any)._menu as HTMLElement;
    const boundValue = select.dataset['uiValue'];
    if (
      boundValue !== undefined
      && select.value !== boundValue
      && Array.from(select.options).some((option) => option.value === boundValue)
    ) {
      select.value = boundValue;
    }
    label.textContent = select.selectedOptions[0]?.textContent?.trim() || '';
    trigger.disabled = select.disabled;
    menu.replaceChildren(...Array.from(select.options).map((option) => {
      const button = this.document.createElement('button');
      button.type = 'button';
      button.className = `ui-select-option${option.selected ? ' active' : ''}`;
      button.textContent = option.textContent;
      button.disabled = option.disabled;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(option.selected));
      button.addEventListener('click', () => {
        if (button.disabled) return;
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        this.refresh(select);
        this.close(true);
      });
      return button;
    }));
  }

  private open(wrapper: HTMLElement): void {
    this.close();
    const select = (wrapper as any)._nativeSelect as EnhancedSelect;
    if (select.disabled) return;
    this.refresh(select);
    const menu = (wrapper as any)._menu as HTMLElement;
    wrapper.classList.add('open');
    menu.classList.add('open');
    this.active = wrapper;
    this.position(wrapper, menu);
  }

  private position(wrapper: HTMLElement, menu: HTMLElement): void {
    const rect = wrapper.getBoundingClientRect();
    const viewportWidth = this.document.documentElement.clientWidth;
    const viewportHeight = this.document.documentElement.clientHeight;
    const width = Math.min(Math.max(rect.width, 160), viewportWidth - 24);
    menu.style.width = `${width}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.left, viewportWidth - width - 12))}px`;
    menu.style.top = `${rect.bottom + 6}px`;
    if (rect.bottom + 6 + Math.min(menu.scrollHeight, 320) > viewportHeight - 12) {
      menu.style.top = `${Math.max(12, rect.top - Math.min(menu.scrollHeight, 320) - 6)}px`;
    }
  }

  private close(focus = false): void {
    if (!this.active) return;
    const trigger = this.active.querySelector<HTMLButtonElement>('.ui-select-trigger');
    (this.active as any)._menu?.classList.remove('open');
    this.active.classList.remove('open');
    this.active = null;
    if (focus) trigger?.focus();
  }
}
