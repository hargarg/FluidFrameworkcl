import { ICollaborativeObject, ICollaborativeObjectExtension } from "@prague/api-definitions";
import { IDistributedObjectServices, IRuntime, ISequencedObjectMessage } from "@prague/runtime-definitions";
import { SharedNumberSequence, SharedObjectSequence} from "./sequence";
import { SharedString } from "./sharedString";

export class CollaborativeStringExtension implements ICollaborativeObjectExtension {
    // TODO rename back to https://graph.microsoft.com/types/mergeTree/string once paparazzi is able to dynamically
    // load code
    public static Type = "https://graph.microsoft.com/types/mergeTree";

    public type: string = CollaborativeStringExtension.Type;

    public async load(
        document: IRuntime,
        id: string,
        sequenceNumber: number,
        minimumSequenceNumber: number,
        messages: ISequencedObjectMessage[],
        services: IDistributedObjectServices,
        headerOrigin: string): Promise<ICollaborativeObject> {

        const collaborativeString = new SharedString(document, id, sequenceNumber, services);
        await collaborativeString.load(sequenceNumber, minimumSequenceNumber, messages, headerOrigin, services);
        return collaborativeString;
    }

    public create(document: IRuntime, id: string, options?: any): ICollaborativeObject {
        const collaborativeString = new SharedString(document, id, 0);
        collaborativeString.initializeLocal();
        return collaborativeString;
    }
}

export class CollaborativeObjectSequenceExtension implements ICollaborativeObjectExtension {
    public static Type = "https://graph.microsoft.com/types/mergeTree/object-sequence";

    public type: string = CollaborativeObjectSequenceExtension.Type;

    public async load(
        document: IRuntime,
        id: string,
        sequenceNumber: number,
        minimumSequenceNumber: number,
        messages: ISequencedObjectMessage[],
        services: IDistributedObjectServices,
        headerOrigin: string): Promise<ICollaborativeObject> {

        const collaborativeSeq = new SharedObjectSequence<object>(document, id, sequenceNumber, services);
        await collaborativeSeq.load(sequenceNumber, minimumSequenceNumber, messages, headerOrigin, services);
        return collaborativeSeq;
    }

    public create(document: IRuntime, id: string, options?: any): ICollaborativeObject {
        const collaborativeString = new SharedObjectSequence(document, id, 0);
        collaborativeString.initializeLocal();
        return collaborativeString;
    }
}

export class CollaborativeNumberSequenceExtension implements ICollaborativeObjectExtension {
    public static Type = "https://graph.microsoft.com/types/mergeTree/number-sequence";

    public type: string = CollaborativeNumberSequenceExtension.Type;

    public async load(
        document: IRuntime,
        id: string,
        sequenceNumber: number,
        minimumSequenceNumber: number,
        messages: ISequencedObjectMessage[],
        services: IDistributedObjectServices,
        headerOrigin: string): Promise<ICollaborativeObject> {

        const collaborativeSeq = new SharedNumberSequence(document, id, sequenceNumber, services);
        await collaborativeSeq.load(sequenceNumber, minimumSequenceNumber, messages, headerOrigin, services);
        return collaborativeSeq;
    }

    public create(document: IRuntime, id: string, options?: any): ICollaborativeObject {
        const collaborativeString = new SharedNumberSequence(document, id, 0);
        collaborativeString.initializeLocal();
        return collaborativeString;
    }
}
