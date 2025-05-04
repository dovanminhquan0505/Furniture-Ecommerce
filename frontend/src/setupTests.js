import { TextEncoder, TextDecoder } from 'text-encoding';
import '@testing-library/jest-dom';
import { ReadableStream, WritableStream, TransformStream } from 'web-streams-polyfill';

// Polyfill TextEncoder và TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill Web Streams API
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;