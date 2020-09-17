export enum IListEvents {
    ListValueChanged = "listChanged",
    ListCreated = "listCreated",
    ListDeleted = "listDeleted",
    ListAttributeDeleted = "listAttributeDeleted",
    InsertUpdateListAttribute = "insertOrUpdateAttribute"

}

export interface IListComponent {
    getAllItems<T>(): T;
    createItem(listId?: string);
    insertOrUpdateAttributeInItem<T>(listId: string, key: string, value: T);
    deleteItemAttribute(listId: string, key: string);
    deleteItem(listId: string);
    getAttributeInList(listId: string, key: string);


}
