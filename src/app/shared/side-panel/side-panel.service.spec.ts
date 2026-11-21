import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SidePanelRef } from './side-panel.models';
import { SidePanelService } from './side-panel.service';

@Component({ template: '' })
class DummyPanel {}

describe('SidePanelService', () => {
  let service: SidePanelService;

  beforeEach(() => {
    service = TestBed.inject(SidePanelService);
  });

  it('opens a panel with its options and closes it with a result', async () => {
    const ref = service.open<string>(DummyPanel, { title: 'Edit', inputs: { id: 1 } });

    expect(service.state()?.component).toBe(DummyPanel);
    expect(service.state()?.options.title).toBe('Edit');

    ref.close('saved');

    await expect(ref.closed).resolves.toBe('saved');
    expect(service.state()).toBeNull();
  });

  it('resolves with undefined when dismissed', async () => {
    const ref = service.open(DummyPanel, { title: 'New' });
    service.close();

    await expect(ref.closed).resolves.toBeUndefined();
    expect(service.state()).toBeNull();
  });

  it('dismisses the previous panel when another one opens', async () => {
    const first = service.open(DummyPanel, { title: 'First' });
    const second = service.open(DummyPanel, { title: 'Second' });

    await expect(first.closed).resolves.toBeUndefined();
    expect(service.state()?.ref).toBe(second);
    expect(service.state()?.options.title).toBe('Second');
  });

  it('provides the ref to the content component injector', () => {
    const ref = service.open(DummyPanel, { title: 'Edit' });
    expect(service.state()?.injector.get(SidePanelRef)).toBe(ref);
  });

  it('ignores a second close', async () => {
    const ref = service.open<string>(DummyPanel, { title: 'Edit' });
    ref.close('first');
    ref.close('second');

    await expect(ref.closed).resolves.toBe('first');
  });
});
