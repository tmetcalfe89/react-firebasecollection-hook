import { useCallback, useMemo } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  query,
  setDoc,
} from "firebase/firestore";
import { useCollection as rfhUseCollection } from "react-firebase-hooks/firestore";

export const Statuses = {
  loading: "loading",
  errored: "errored",
  loaded: "loaded",
};

export default function useCollection(db, dbName, { queries = [] } = {}) {
  const collectionRef = useMemo(() => collection(db, dbName), [db, dbName]);
  const [collectionData, loading, error] = rfhUseCollection(
    query(collectionRef, ...queries)
  );

  const docs = useMemo(() => {
    return collectionData?.docs?.map((doc) => ({ ...doc.data(), id: doc.id }));
  }, [collectionData]);

  const docsById = useMemo(() => {
    return (
      collectionData?.docs?.reduce(
        (acc, doc) => ({
          ...acc,
          [doc.id]: { ...doc.data(), id: doc.id },
        }),
        {}
      ) || {}
    );
  }, [collectionData]);

  const count = useMemo(() => {
    return collectionData?.docs?.length || 0;
  }, [collectionData]);

  const addEntry = useCallback(
    async (card) => {
      const addRes = await addDoc(collectionRef, card);
      const getRes = await getDoc(doc(collectionRef, addRes.id));
      return { id: addRes.id, ...getRes.data() };
    },
    [collectionRef]
  );

  const modifyEntry = useCallback(
    async ({ id, ...card }) => {
      await setDoc(doc(collectionRef, id), card, { merge: true });
      const getRes = await getDoc(doc(collectionRef, id));
      return { id, ...getRes.data() };
    },
    [collectionRef]
  );

  const deleteEntry = useCallback(
    async (id) => {
      await deleteDoc(doc(collectionRef, id));
    },
    [collectionRef]
  );

  const status = useMemo(
    () =>
      loading ? Statuses.loading : error ? Statuses.errored : Statuses.loaded,
    [loading, error]
  );

  return {
    allList: docs,
    allById: docsById,
    count,
    status,
    add: addEntry,
    modify: modifyEntry,
    remove: deleteEntry,
  };
}
