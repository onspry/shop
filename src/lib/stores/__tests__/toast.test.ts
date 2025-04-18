import { get } from 'svelte/store';
import toastStore from '../toast';

describe('toast store', () => {
  beforeEach(() => {
    toastStore.set([]);
  });

  it('adds a toast notification', () => {
    toastStore.add({
      message: 'Test toast',
      type: 'success',
    });
    const notifications = get(toastStore);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toBe('Test toast');
    expect(notifications[0].visible).toBe(true);
    expect(notifications[0].type).toBe('success');
    expect(typeof notifications[0].id).toBe('string');
  });

  it('adds a toast with actions', () => {
    toastStore.add({
      message: 'Toast with action',
      type: 'info',
      actions: [
        { label: 'Action', href: '/somewhere' }
      ]
    });
    const notifications = get(toastStore);
    expect(notifications[0].actions).toBeDefined();
    expect(notifications[0].actions![0].label).toBe('Action');
    expect(notifications[0].actions![0].href).toBe('/somewhere');
  });

  it('removes a toast notification', () => {
    const id = toastStore.add({ message: 'To remove', type: 'error' });
    expect(get(toastStore)).toHaveLength(1);
    toastStore.remove(id);
    expect(get(toastStore)).toHaveLength(0);
  });

  it('adds a success toast', () => {
    toastStore.success('Success!');
    const notifications = get(toastStore);
    expect(notifications[0].type).toBe('success');
  });

  it('adds an error toast', () => {
    toastStore.error('Error!');
    const notifications = get(toastStore);
    expect(notifications[0].type).toBe('error');
  });

  it('adds an info toast', () => {
    toastStore.info('Info!');
    const notifications = get(toastStore);
    expect(notifications[0].type).toBe('info');
  });
});
