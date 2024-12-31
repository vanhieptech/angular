import { TestBed } from '@angular/core/testing';
import { MessageService } from './message.service';
import { MessageBridgeFactory } from './message-bridge.factory';
import { MessageBridge, Message } from '../interfaces/message.interface';
import { firstValueFrom } from 'rxjs';

describe('MessageService', () => {
  let service: MessageService;
  let mockBridge: jest.Mocked<MessageBridge>;
  let mockBridgeFactory: { createBridge: jest.Mock };

  beforeEach(() => {
    mockBridge = {
      sendMessage: jest.fn(),
      addMessageListener: jest.fn(),
      removeMessageListener: jest.fn(),
    };

    mockBridgeFactory = {
      createBridge: jest.fn().mockReturnValue(mockBridge),
    };

    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: MessageBridgeFactory, useValue: mockBridgeFactory },
      ],
    });

    service = TestBed.inject(MessageService);
  });

  it('should send messages correctly', async () => {
    const testMessage = { type: 'TEST', payload: 'test' };
    await service.sendMessage(testMessage.type, testMessage.payload);

    expect(mockBridge.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('TEST')
    );
  });

  it('should handle message reception', async () => {
    const testMessage: Message = {
      type: 'TEST',
      payload: 'test',
      timestamp: Date.now(),
    };

    const messagePromise = firstValueFrom(service.onMessage('TEST'));

    // Get the callback and simulate message reception
    const [[callback]] = mockBridge.addMessageListener.mock.calls;
    callback(JSON.stringify(testMessage));

    const receivedMessage = await messagePromise;
    expect(receivedMessage).toMatchObject({
      type: testMessage.type,
      payload: testMessage.payload,
    });
  });

  it('should clean up listeners on destroy', () => {
    service.ngOnDestroy();
    expect(mockBridge.removeMessageListener).toHaveBeenCalled();
  });

  it('should handle invalid message formats', async () => {
    const [[callback]] = mockBridge.addMessageListener.mock.calls;
    callback('invalid-json');

    // Should not throw error
    expect(() => callback('invalid-json')).not.toThrow();
  });
});
