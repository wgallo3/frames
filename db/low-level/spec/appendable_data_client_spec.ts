
import { makeid, client, TEST_DATA_DIR, exists, failDone,
         checkForLeakErrors } from "./test_util";

import { AppendableDataHandle, FromDataIDHandleResponse,
         StructuredDataHandle, TYPE_TAG_VERSIONED,
         DataIDHandle, AppedableDataMetadata, setCollectLeakStats,
         setCollectLeakStatsBlock, getLeakStatistics, LeakResults
       } from "../index";

describe("An appendable data client", () => {

    beforeAll(() => {
        setCollectLeakStats();
    });

    afterAll(() => {
        checkForLeakErrors();
    });

    it("can create an appendable data, and drop it", async (done) => {
        setCollectLeakStatsBlock("ad:test1: create and drop");

        const appdat: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);
        await failDone(appdat.save(), done);
        await failDone(appdat.drop(), done);
        done();
    });

    it("can read the metadata of a fresh appendable data", async (done) => {
        setCollectLeakStatsBlock("ad:test2: read metadata");
        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);
        await failDone(appDataID.save(), done);
        const metadata: AppedableDataMetadata =
            await failDone(appDataID.getMetadata(), done);

        expect(metadata.dataLength).toBe(0);
        expect(metadata.isOwner).toBe(true);

        await failDone(appDataID.drop(), done);

        done();
    });

    it("can convert an appendable-data-id to a data-id", async (done) => {
        setCollectLeakStatsBlock("ad:test3: to data-id");

        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);
        const dataID: DataIDHandle =
            await failDone(appDataID.toDataIdHandle(), done);
        await failDone(appDataID.drop(), done);
        await failDone(dataID.drop(), done);
        done();
    });

    it("can convert an appendable-data-id to a data-id and back again", async (done) => {
        setCollectLeakStatsBlock("ad:test4: round trip data-id");

        const appDataID: AppendableDataHandle =
            await failDone(client.ad.create("Some name" + makeid()), done);

        await failDone(appDataID.save(), done);

        const dataID: DataIDHandle =
            await failDone(appDataID.toDataIdHandle(), done);

        const res: FromDataIDHandleResponse =
            await failDone(client.ad.fromDataIdHandle(dataID), done);

        await failDone(appDataID.drop(), done);
        await failDone(dataID.drop(), done);
        await failDone(res.handleId.drop(), done);

        done();
    });

    it("can append a structured data to an appendable data", async (done) => {
        setCollectLeakStatsBlock("ad:test5: append structured data");

        const parentName: string = "Parent " + makeid();
        const childName: string = "Child " + makeid();

        // make the appendable data and save it to the network
        const parent: AppendableDataHandle =
            await failDone(client.ad.create(parentName), done);
        await failDone(parent.save(), done);

        const parentDataID: DataIDHandle =
            await failDone(parent.toDataIdHandle(), done);

        // make the structured data, and save it to the network
        const child: StructuredDataHandle =
            await failDone(client.structured.create(
                childName, TYPE_TAG_VERSIONED, {"child": true}), done);
        await failDone(child.save(), done);

        // append the data, creating a cleaning up a dataID handle along the way
        const childDataID: DataIDHandle =
            await failDone(child.toDataIdHandle(), done);
        await failDone(parent.append(childDataID), done);
        await failDone(childDataID.drop(), done);
        await failDone(child.drop(), done);

        // drop the parent handle so that we can refresh it
        await failDone(parent.drop(), done);

        const refreshedParent: FromDataIDHandleResponse =
            await failDone(client.ad.fromDataIdHandle(parentDataID), done);
        expect(refreshedParent.dataLength).toBe(1);
        const refreshedParrentHandle: AppendableDataHandle = refreshedParent.handleId;

        const childDataId2: DataIDHandle =
            await failDone(refreshedParrentHandle.at(0), done);
        const child2: StructuredDataHandle =
            (await failDone(client.structured.fromDataIdHandle(childDataId2), done)).handleId;
        const childContent = await failDone(child2.readAsObject(), done);
        expect(childContent.child).toBe(true);

        await failDone(child2.drop(), done);
        await failDone(refreshedParent.handleId.drop(), done);
        await failDone(childDataId2.drop(), done);
        await failDone(parentDataID.drop(), done);

        done();
    });

});

