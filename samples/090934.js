/**
  * Show blocking products dialog using uiLib
  * @param {string} quoteId - The quote GUID
  * @param {Array} items - Array of product issues
  */
showBlockingProductsDialog: (quoteId, items) => {
    const uiLib = getUiLib();
    const CONFIG = HNC[ENTITYTYPE].CONFIG;
    const baseUrl = Xrm.Utility.getGlobalContext().getClientUrl();

    // Map blockType to display information
    const getBlockTypeInfo = (blockType) => {
        switch (blockType) {
            case CONFIG.BLOCK_TYPE.INACTIVE:
                return { icon: '⛔', reason: 'Product is inactive and must be activated or replaced' };
            case CONFIG.BLOCK_TYPE.NOT_SYNCED:
                return { icon: '🚫', reason: 'Product is not synchronized with Business Central' };
            case CONFIG.BLOCK_TYPE.PLACEHOLDER:
                return { icon: '📝', reason: 'Placeholder product must be replaced with actual product' };
            default:
                return { icon: '❓', reason: 'Unknown issue' };
        }
    };

    // Structure the data properly for the table component
    const tableData = items.map((item, index) => {
        const info = getBlockTypeInfo(item.blockType);
        const fullLink = `${baseUrl}/main.aspx?etn=product&id=${item.id}&pagetype=entityrecord`;
        return {
            id: index + 1,  // Required for React keys
            status: info.icon,
            product: `<a href="${fullLink}" target="_blank" style="color: #0078d4; text-decoration: none; font-weight: 500;">${item.name || 'Unknown Product'}</a>`,
            reason: info.reason
        };
    });

    // Determine if any inactive products exist
    const hasInactiveProducts = items.some(item => item.blockType === CONFIG.BLOCK_TYPE.INACTIVE);
    const hasNotSyncedOrPlaceholder = items.some(item =>
        item.blockType === CONFIG.BLOCK_TYPE.NOT_SYNCED ||
        item.blockType === CONFIG.BLOCK_TYPE.PLACEHOLDER
    );

    // Determine message and title
    const message = hasInactiveProducts
        ? "You cannot win this quote because the following products are inactive. Inactive products must be activated or replaced before you can proceed."
        : "You cannot win this quote because the following products are not set up and synchronized. Please inform the Product Manager to resolve these issues.";

    const title = hasInactiveProducts ? "Inactive Products Detected" : "Product Validation Required";

    // Build fields array for modal
    const fields = [
        {
            id: 'productsTable',
            type: 'table',
            data: tableData,
            tableColumns: [
                {
                    id: 'status',
                    header: 'Status',
                    visible: true,
                    sortable: false,
                    width: '80px',
                    align: 'center'
                },
                {
                    id: 'product',
                    header: 'Product',
                    visible: true,
                    sortable: true,
                    width: '40%'
                },
                {
                    id: 'reason',
                    header: 'Reason',
                    visible: true,
                    sortable: true,
                    width: 'auto'
                }
            ],
            selectionMode: 'none',
            pageSize: 10
        }
    ];

    // Build buttons
    const buttons = [];
    if (hasNotSyncedOrPlaceholder) {
        buttons.push(new uiLib.Button({
            label: 'Notify Product Manager',
            callback: async () => {
                await HNC[ENTITYTYPE].ProductValidation.notifyProductManager(quoteId);
                return true;
            },
            id: 'notifyBtn'
        }));
    }
    buttons.push(new uiLib.Button({
        label: 'Close',
        callback: () => true,
        setFocus: true,
        id: 'closeBtn'
    }));

    const modal = new uiLib.Modal({
        title: title,
        message: message,
        fields: fields,
        size: { width: 800, height: Math.min(600, 400 + items.length * 50) },
        buttons: buttons,
        debug: true
    });
    modal.show();

};